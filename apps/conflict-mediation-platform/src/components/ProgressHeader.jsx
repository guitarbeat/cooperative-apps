import React from "react";
import { Users } from "lucide-react";
import FormProgressIndicator from "./FormProgressIndicator";
import { SURVEY_CATEGORIES, getCategoryByStep, getOverallProgress } from "../config/surveyCategories";

const STEPS = [
  "Setup",
  "Individual Reflection - Party A",
  "Individual Reflection - Party B",
  "Shared Discussion (ABCDE)",
  "Solution Development",
  "Agreement & Action Steps",
  "Export & Save",
];

const ProgressHeader = ({ currentStep, totalSteps, formData, completedFields = 0, totalFields = 0 }) => {
  const currentCategory = getCategoryByStep(currentStep);
  const overallProgress = getOverallProgress(formData);
  
  const getStepDescription = (step) => {
    switch (step) {
      case 1:
        return "Both parties, please fill out this section together.";
      case 2:
        return `${
          formData.partyAName || "Party A"
        }, please complete this section individually.`;
      case 3:
        return `${
          formData.partyBName || "Party B"
        }, please complete this section individually.`;
      case 4:
        return "Both parties, please discuss and fill out this section together using the ABCDE model.";
      case 5:
        return "Both parties, please work together to develop solutions and explore possibilities.";
      case 6:
        return "Both parties, finalize your agreement and create actionable next steps.";
      case 7:
        return "Export a PDF or JSON, or import a previous session to continue.";
      default:
        return "";
    }
  };

  const isIndividualStep = currentStep === 2 || currentStep === 3;

  return (
    <div className="mb-3">
      {/* Category Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentCategory?.icon}</span>
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {currentCategory?.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentCategory?.description}
              </p>
            </div>
          </div>
          <div className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {overallProgress.completed} of {overallProgress.total} steps
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Main Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {STEPS[currentStep - 1]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getStepDescription(currentStep)}
            </p>
          </div>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
          {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Privacy notice for individual sections */}
      {isIndividualStep && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
          <span>🔒</span>
          <span>
            Private reflection space - other party should not view until shared
            discussion.
          </span>
        </div>
      )}

      {/* Enhanced Progress Indicator */}
      <div className="mt-4">
        <FormProgressIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          completedFields={completedFields}
          totalFields={totalFields}
          showFieldProgress={true}
        />
      </div>
    </div>
  );
};

export default ProgressHeader;
