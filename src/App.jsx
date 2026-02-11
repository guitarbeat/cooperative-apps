import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import DarkModeToggle from "./components/DarkModeToggle";
import CategoryNavigation from "./components/CategoryNavigation";
import NavigationButtons from "./components/NavigationButtons";
import CardStack from "./components/CardStack";
import StepContent from "./components/StepContent";
import { useFormData } from "./hooks/useFormData";
import { useNavigation } from "./hooks/useNavigation";
import { Toaster } from "./components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { toast } from "sonner";
import logo from "./assets/logo.png";
import { SURVEY_CATEGORIES } from "./config/surveyCategories";
import "./App.css";

const TOTAL_SURVEY_STEPS =
  Object.values(SURVEY_CATEGORIES)
    .flatMap((category) => category.steps)
    .reduce((highest, step) => Math.max(highest, step), 0) || 1;

const getSubStepCountForStep = (step) => {
  if (step === 2 || step === 3) {
    return 3;
  }
  return 0;
};

const FIELD_LABELS = {
  partyAName: "Party A Name",
  partyBName: "Party B Name",
  conflictDescription: "Conflict Description",
  partyAThoughts: "Party A - Thoughts",
  partyAAssertiveApproach: "Party A - Assertive Approach",
  partyBThoughts: "Party B - Thoughts",
  partyBAssertiveApproach: "Party B - Assertive Approach",
  activatingEvent: "Activating Event",
  partyABeliefs: "Party A - Beliefs",
  partyBBeliefs: "Party B - Beliefs",
  partyAMiracle: "Party A - Miracle Response",
  partyBMiracle: "Party B - Miracle Response",
  compromiseSolutions: "Compromise Solutions",
  partyATop3Solutions: "Party A - Top Solutions",
  partyBTop3Solutions: "Party B - Top Solutions",
  actionSteps: "Action Steps",
  followUpDate: "Follow-up Date",
};

function App() {
  // Form data management
  const {
    formData,
    updateFormData,
    updateMultipleFields,
    loadedFromStorage,
    resetFormData,
    getRequiredFieldsForStep,
    isStepComplete,
    getMissingFieldsForStep,
  } = useFormData();

  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [errorStep, setErrorStep] = useState(null);

  const navigationGuard = useCallback(
    ({ currentStep: step, direction }) => {
      if (direction === "forward" && !isStepComplete(step, currentSubStep)) {
        setErrorStep(step);
        const missingFields = getMissingFieldsForStep(step, currentSubStep);
        if (missingFields.length > 0) {
          const fieldNames = missingFields
            .map((field) => FIELD_LABELS[field] ?? field)
            .join(", ");
          toast.error(
            `Complete the required fields before continuing: ${fieldNames}`,
          );
        } else {
          toast.error("Complete the required fields before continuing.");
        }
        return false;
      }

      if (direction === "backward") {
        setErrorStep(null);
      }

      return true;
    },
    [getMissingFieldsForStep, isStepComplete, currentSubStep],
  );

  // Create a ref to store the latest navigation guard function
  // This allows us to pass a stable function reference to useNavigation
  const navigationGuardRef = useRef(navigationGuard);

  useEffect(() => {
    navigationGuardRef.current = navigationGuard;
  }, [navigationGuard]);

  // Stable callback that delegates to the current guard implementation
  const stableNavigationGuard = useCallback((...args) => {
    return navigationGuardRef.current(...args);
  }, []);

  // Navigation management
  const {
    currentStep,
    animatingCard,
    animationType,
    isAnimating,
    totalSteps,
    navigateToStep,
  } = useNavigation({
    canNavigateToStep: stableNavigationGuard,
    totalSteps: TOTAL_SURVEY_STEPS,
  });

  const canGoNext = useMemo(
    () => isStepComplete(currentStep, currentSubStep),
    [currentStep, currentSubStep, isStepComplete],
  );

  useEffect(() => {
    if (canGoNext && errorStep === currentStep) {
      setErrorStep(null);
    }
  }, [canGoNext, currentStep, errorStep]);

  // Keyboard navigation: Left/Right arrows
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isAnimating) return;
      const target = e.target;
      const isFormElement = target && (target.closest?.("input, textarea, select, [contenteditable=true]"));
      if (isFormElement) return;
      if (e.key === "ArrowRight") {
        navigateToStep("next");
      } else if (e.key === "ArrowLeft") {
        navigateToStep("prev");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAnimating, navigateToStep]);

  const handleNavigate = useCallback((direction) => {
    const subStepCount = getSubStepCountForStep(currentStep);

    if (direction === 'next') {
      if (currentSubStep < subStepCount - 1) {
        setCurrentSubStep(currentSubStep + 1);
      } else {
        navigateToStep('next');
        setCurrentSubStep(0);
      }
    } else if (direction === 'prev') {
      if (currentSubStep > 0) {
        setCurrentSubStep(currentSubStep - 1);
      } else {
        const prevStep = currentStep - 1;
        const prevSubStepCount = getSubStepCountForStep(prevStep);
        navigateToStep('prev');
        setCurrentSubStep(prevSubStepCount > 0 ? prevSubStepCount - 1 : 0);
      }
    } else {
      navigateToStep(direction);
    }
  }, [currentStep, currentSubStep, navigateToStep]);

  // Export functions
  const exportToJSON = useCallback(() => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `conflict-mediation-${
      new Date().toISOString().split("T")[0]
    }.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }, [formData]);

  const renderStepContent = useCallback((step) => {
    return (
      <StepContent
        step={step}
        formData={formData}
        updateFormData={updateFormData}
        updateMultipleFields={updateMultipleFields}
        onExportJSON={exportToJSON}
        showErrors={errorStep === step}
        getRequiredFieldsForStep={getRequiredFieldsForStep}
        currentSubStep={currentSubStep}
        setCurrentSubStep={setCurrentSubStep}
      />
    );
  }, [
    formData,
    updateFormData,
    updateMultipleFields,
    exportToJSON,
    errorStep,
    getRequiredFieldsForStep,
    currentSubStep
  ]);
  }, [formData, updateFormData, updateMultipleFields, exportToJSON, errorStep, getRequiredFieldsForStep, currentSubStep]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <DarkModeToggle />

      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 sm:px-6 py-6 max-w-4xl">
          <img
            src={logo}
            alt="Co-op logo"
            className="h-12 w-12 rounded-lg border border-border bg-background object-contain shadow-sm"
          />
          <div className="flex-1">
            <h1 className="text-heading-lg text-foreground mb-1">
              Co-op Conflict Resolution Platform
            </h1>
            <p className="text-body-md text-muted-foreground">
              Guide teams through mediation steps and capture agreements with confidence.
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto w-full px-4 py-6 pb-28 sm:pb-8 max-w-4xl">
        {loadedFromStorage && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-muted/50 border border-border text-body-sm flex items-center justify-between shadow-sm">
            <span className="text-muted-foreground">Resumed a previously saved session from this device.</span>
            <button 
              onClick={resetFormData} 
              className="text-ui-sm text-primary hover:text-primary-hover transition-colors underline-offset-2 hover:underline"
            >
              Reset
            </button>
          </div>
        )}

        {/* Category Navigation */}
        <CategoryNavigation
          formData={formData}
          currentStep={currentStep}
          onNavigateToStep={navigateToStep}
        />


        {/* Card Stack */}
        <CardStack
          totalSteps={totalSteps}
          currentStep={currentStep}
          animatingCard={animatingCard}
          animationType={animationType}
          stepElements={stepElements}
          onNavigate={handleNavigate}
          isDragging={isDragging}
          onInputStart={handleInputStart}
          onInputMove={handleInputMove}
          onInputEnd={handleInputEnd}
          onMouseLeave={handleMouseLeave}
          renderStepContent={renderStepContent}
        />

        {/* Navigation Buttons */}
        <NavigationButtons
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNavigate={handleNavigate}
          isAnimating={isAnimating}
          canGoNext={canGoNext}
          currentSubStep={currentSubStep}
          subStepCount={getSubStepCountForStep(currentStep)}
        />

      </div>
      <Analytics />
    </div>
  );
}

export default App;
