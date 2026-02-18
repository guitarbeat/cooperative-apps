import React from "react";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

const FormProgressIndicator = ({
  currentStep,
  totalSteps,
  completedFields = 0,
  totalFields = 0,
  className = "",
  showFieldProgress = true,
}) => {
  const stepProgress = (currentStep / totalSteps) * 100;
  const fieldProgress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  const getStepStatus = (step) => {
    if (step < currentStep) return "completed";
    if (step === currentStep) return "current";
    return "upcoming";
  };

  const getStepIcon = (step) => {
    const status = getStepStatus(step);
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />;
      case "current":
        return <Circle className="h-4 w-4 text-primary" aria-hidden="true" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
    }
  };

  const getStepLabel = (step) => {
    const labels = {
      1: "Basic Info",
      2: "Party A Reflection",
      3: "Party B Reflection", 
      4: "ABCDE Analysis",
      5: "Solutions",
      6: "Action Plan",
      7: "Export"
    };
    return labels[step] || `Step ${step}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Step Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium" id="step-progress-label">Progress</span>
          <span className="text-muted-foreground">{currentStep}/{totalSteps}</span>
        </div>
        <div
          className="w-full bg-muted rounded-full h-2"
          role="progressbar"
          aria-valuenow={Math.round(stepProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="step-progress-label"
          aria-label="Step Progress"
        >
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${stepProgress}%` }}
          />
        </div>
      </div>

      {/* Field Progress */}
      {showFieldProgress && totalFields > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium" id="field-progress-label">Fields Completed</span>
            <span className="text-muted-foreground">{completedFields}/{totalFields}</span>
          </div>
          <div
            className="w-full bg-muted rounded-full h-1.5"
            role="progressbar"
            aria-valuenow={Math.round(fieldProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby="field-progress-label"
            aria-label="Field Progress"
          >
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${fieldProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2 list-none p-0 m-0">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const status = getStepStatus(step);
          const label = getStepLabel(step);
          const isCurrent = status === "current";
          
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
                status === "completed" && "bg-green-50 text-green-700",
                status === "current" && "bg-primary/10 text-primary",
                status === "upcoming" && "bg-muted text-muted-foreground"
              )}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${label} - ${status}`}
            >
              {getStepIcon(step)}
              <span className="font-medium">{label}</span>
            </li>
          );
        })}
      </ol>

      {/* Completion Status */}
      {currentStep === totalSteps && (
        <div
          className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md"
          role="status"
        >
          <CheckCircle className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">Form completed successfully!</span>
        </div>
      )}
    </div>
  );
};

export default FormProgressIndicator;
