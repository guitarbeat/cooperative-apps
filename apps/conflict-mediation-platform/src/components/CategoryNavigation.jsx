import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  ChevronUp,
} from "lucide-react";
import {
  SURVEY_CATEGORIES,
  getCategoryProgress,
} from "../config/surveyCategories";

const CategoryNavigation = ({
  formData,
  currentStep,
  onNavigateToStep,
}) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(false);

  const toggleCategory = (categoryId) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const toggleOverview = () => {
    setIsOverviewCollapsed((prev) => !prev);
  };

  const getStepInCategory = (category, step) => {
    const stepIndex = category.steps.indexOf(step);
    return stepIndex + 1; // 1-based index
  };

  const getStepName = (step) => {
    const stepNames = [
      "Setup & Information",
      "Party A Reflection",
      "Party B Reflection",
      "ABCDE Analysis",
      "Solution Development",
      "Agreement & Planning",
      "Export & Summary",
    ];

    return stepNames[step - 1] || `Step ${step}`;
  };

  const renderStepButton = (category, step, progress) => {
    const isCurrentStep = step === currentStep;
    const isCompleted =
      progress.completed >= getStepInCategory(category, step);
    return (
      <button
        key={step}
        type="button"
        onClick={() => onNavigateToStep(step)}
        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-body-md transition-all duration-normal ${
          isCurrentStep
            ? "bg-primary/20 text-primary font-medium shadow-sm"
            : isCompleted
            ? "text-success hover:bg-success/10"
            : "text-muted-foreground hover:bg-muted/50"
        } cursor-pointer`}
      >
        {isCompleted ? (
          <CheckCircle className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        )}
        <span className="flex-1">{getStepName(step)}</span>
        {isCurrentStep && (
          <span className="badge badge-primary">
            Current
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
      <button
        type="button"
        onClick={toggleOverview}
        className="w-full text-left mb-6 flex items-center justify-between hover:bg-muted/50 rounded-lg p-2 -m-2 transition-all duration-normal"
      >
        <h3 className="text-heading-md flex items-center gap-3">
          <span role="img" aria-label="Survey overview">
            📊
          </span>
          Survey Progress Overview
        </h3>
        {isOverviewCollapsed ? (
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-normal" aria-hidden="true" />
        ) : (
          <ChevronUp className="h-5 w-5 text-muted-foreground transition-transform duration-normal" aria-hidden="true" />
        )}
      </button>

      {!isOverviewCollapsed && (
        <div className="space-y-3">
          {Object.values(SURVEY_CATEGORIES).map((category) => {
            const progress = getCategoryProgress(formData, category);
            const isExpanded = expandedCategory === category.id;
            const isCurrentCategory = category.steps.includes(currentStep);

            return (
              <div
                key={category.id}
                className="border border-border rounded-lg overflow-hidden transition-all duration-normal hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full p-4 text-left flex items-center justify-between transition-all duration-normal ${
                    isCurrentCategory
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : "hover:bg-muted/50"
                  }`}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl" aria-hidden="true">
                      {category.icon}
                    </span>
                    <div>
                      <h4 className="text-heading-sm mb-1">{category.name}</h4>
                      <p className="text-body-sm text-muted-foreground">
                        {progress.total > 0
                          ? `${progress.completed} of ${progress.total} steps completed`
                          : progress.optional > 0
                          ? `${progress.optional} optional ${
                              progress.optional === 1 ? "step" : "steps"
                            }`
                          : "No required steps"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-normal ${
                          progress.percentage === 100
                            ? "bg-success"
                            : "bg-primary"
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>

                    {isExpanded ? (
                      <ChevronDown
                        className="h-4 w-4 text-muted-foreground transition-transform duration-normal"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronRight
                        className="h-4 w-4 text-muted-foreground transition-transform duration-normal"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <p className="text-body-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>

                    <div className="space-y-2">
                      {category.steps.map((step) =>
                        renderStepButton(category, step, progress)
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const arePropsEqual = (prevProps, nextProps) => {
  if (prevProps.currentStep !== nextProps.currentStep) return false;
  // If the navigation handler changes, we must re-render.
  // Note: In App.jsx, we've optimized this to be stable via useCallback,
  // but we check it here for correctness.
  if (prevProps.onNavigateToStep !== nextProps.onNavigateToStep) return false;

  // Check if progress has changed for any category.
  // We avoid re-rendering if formData changes but the completion status
  // of steps remains the same (e.g., typing in an already valid field).
  const categories = Object.values(SURVEY_CATEGORIES);
  for (const category of categories) {
    const prevProgress = getCategoryProgress(prevProps.formData, category);
    const nextProgress = getCategoryProgress(nextProps.formData, category);

    // We only care if completed count changes
    // (total and optional are static configuration)
    if (prevProgress.completed !== nextProgress.completed) {
      return false;
    }
  }

  return true;
};

export default React.memo(CategoryNavigation, arePropsEqual);
