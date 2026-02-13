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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "current":
        return <Circle className="h-4 w-4 text-primary" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
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
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">{currentStep}/{totalSteps}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
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
            <span className="font-medium">Fields Completed</span>
            <span className="text-muted-foreground">{completedFields}/{totalFields}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${fieldProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const status = getStepStatus(step);
          
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
                status === "completed" && "bg-green-50 text-green-700",
                status === "current" && "bg-primary/10 text-primary",
                status === "upcoming" && "bg-muted text-muted-foreground"
              )}
            >
              {getStepIcon(step)}
              <span className="font-medium">{getStepLabel(step)}</span>
            </div>
          );
        })}
      </div>

      {/* Completion Status */}
      {currentStep === totalSteps && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Form completed successfully!</span>
        </div>
      )}
    </div>
  );
};

export default FormProgressIndicator;