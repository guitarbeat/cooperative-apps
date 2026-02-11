import React, { useState, useMemo, useId } from "react";
import { Lightbulb, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { SUGGESTION_TEMPLATES, HELP_TEXTS } from "../config/smartSuggestionsData";

// Pure helper function to generate suggestions
const getSuggestions = (type, value, ctx) => {
  if (!type || !value || value.length <= 2) {
    return [];
  }

  let generatedSuggestions = SUGGESTION_TEMPLATES[type] || [];

  // Filter suggestions based on current value
  if (value && value.trim()) {
    const normalizedValue = value.toLowerCase();
    generatedSuggestions = generatedSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(normalizedValue) ||
      normalizedValue.includes(suggestion.toLowerCase())
    );
  }

  // Add context-specific suggestions
  if (ctx.partyAName && ctx.partyBName && generatedSuggestions.length > 0) {
    generatedSuggestions = generatedSuggestions.map(suggestion =>
      suggestion.replace("[person]", ctx.partyAName || "the other person")
    );
  }

  return generatedSuggestions.slice(0, 5);
};

// Smart suggestions based on field type and content
export const SmartSuggestions = ({
  fieldType,
  currentValue = "",
  context = {},
  onSuggestionSelect,
  className = "",
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const listId = useId();

  const suggestions = useMemo(
    () => getSuggestions(fieldType, currentValue, context),
    [fieldType, currentValue, context]
  );

  const handleSuggestionClick = (suggestion) => {
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
  };

  const handleRefresh = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span>Smart Suggestions</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleRefresh}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh suggestions"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh suggestions</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showSuggestions ? "Hide suggestions" : "Show suggestions"}
                aria-expanded={showSuggestions}
                aria-controls={listId}
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showSuggestions && "rotate-180")} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showSuggestions ? "Hide suggestions" : "Show suggestions"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {showSuggestions && (
        <div className="space-y-1" id={listId}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left p-2 text-sm bg-muted/50 hover:bg-muted rounded-md transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Context-aware help text
export const ContextualHelp = ({
  fieldType,
  className = "",
}) => {
  const helpInfo = HELP_TEXTS[fieldType] || null;

  if (!helpInfo) return null;

  return (
    <div className={cn("p-4 bg-muted/30 rounded-lg space-y-3", className)}>
      <h4 className="font-medium text-sm">{helpInfo.title}</h4>
      <ul className="space-y-1">
        {helpInfo.tips.map((tip, index) => (
          <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Progress indicator for form completion
export const FormProgressIndicator = ({
  currentStep,
  totalSteps,
  completedFields = 0,
  totalFields = 0,
  className = "",
}) => {
  const stepProgress = (currentStep / totalSteps) * 100;
  const fieldProgress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Step Progress</span>
        <span>{currentStep}/{totalSteps}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${stepProgress}%` }}
        />
      </div>
      
      {totalFields > 0 && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Field Progress</span>
            <span>{completedFields}/{totalFields}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <div
              className="bg-green-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${fieldProgress}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};
