import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, XCircle, Loader2, Info } from "lucide-react";
import { cn } from "../lib/utils";
import { ERROR_MESSAGES } from "../utils/errorMessages";

const InputValidation = ({
  value,
  rules = [],
  onValidationChange,
  className = "",
  showIcon = true,
  showMessage = true,
}) => {
  const [validationState, setValidationState] = useState({
    isValid: true,
    isChecking: false,
    errors: [],
    warnings: [],
  });

  useEffect(() => {
    const validateValue = async (val) => {
      setValidationState(prev => ({ ...prev, isChecking: true }));

      const errors = [];
      const warnings = [];

      for (const rule of rules) {
        try {
          const result = await rule.validate(val);
          if (!result.isValid) {
            if (rule.severity === 'warning') {
              warnings.push(result.message);
            } else {
              errors.push(result.message);
            }
          }
        } catch (error) {
          console.error('Validation error:', error);
          errors.push('Validation error occurred');
        }
      }

      const newState = {
        isValid: errors.length === 0,
        isChecking: false,
        errors,
        warnings,
      };

      setValidationState(newState);
      onValidationChange?.(newState);
    };

    if (value !== undefined && value !== null) {
      validateValue(value);
    }
  }, [value, rules, onValidationChange]);

  const getValidationIcon = () => {
    if (!showIcon) return null;

    if (validationState.isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }

    if (validationState.errors.length > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    if (validationState.warnings.length > 0) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }

    if (validationState.isValid && value && value.toString().trim() !== '') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    return null;
  };

  const getValidationMessage = () => {
    if (!showMessage) return null;

    if (validationState.errors.length > 0) {
      return (
        <div className="space-y-2">
          {validationState.errors.map((error, index) => (
            <div key={index} className="space-y-1">
              <p className="text-red-600 text-xs flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {error}
              </p>
              {error.suggestions && error.suggestions.length > 0 && (
                <div className="ml-4 space-y-1">
                  {error.suggestions.map((suggestion, suggestionIndex) => (
                    <p key={suggestionIndex} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {suggestion}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (validationState.warnings.length > 0) {
      return (
        <div className="space-y-2">
          {validationState.warnings.map((warning, index) => (
            <div key={index} className="space-y-1">
              <p className="text-yellow-600 text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {warning}
              </p>
              {warning.suggestions && warning.suggestions.length > 0 && (
                <div className="ml-4 space-y-1">
                  {warning.suggestions.map((suggestion, suggestionIndex) => (
                    <p key={suggestionIndex} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {suggestion}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cn("space-y-1", className)}>
      {getValidationIcon()}
      {getValidationMessage()}
    </div>
  );
};

// Predefined validation rules
export const validationRules = {
  required: (message = "This field is required") => ({
    validate: (value) => ({
      isValid: value && value.toString().trim() !== "",
      message,
    }),
    severity: 'error',
  }),

  minLength: (min, message) => ({
    validate: (value) => ({
      isValid: !value || value.toString().length >= min,
      message: message || `Must be at least ${min} characters long`,
    }),
    severity: 'error',
  }),

  maxLength: (max, message) => ({
    validate: (value) => ({
      isValid: !value || value.toString().length <= max,
      message: message || `Must be no more than ${max} characters long`,
    }),
    severity: 'error',
  }),

  email: (message = "Please enter a valid email address") => ({
    validate: (value) => {
      if (!value) return { isValid: true, message: "" };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(value),
        message,
      };
    },
    severity: 'error',
  }),

  phone: (message = "Please enter a valid phone number") => ({
    validate: (value) => {
      if (!value) return { isValid: true, message: "" };
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
      return {
        isValid: phoneRegex.test(value.replace(/[\s\-()]/g, '')),
        message,
      };
    },
    severity: 'error',
  }),

  url: (message = "Please enter a valid URL") => ({
    validate: (value) => {
      if (!value) return { isValid: true, message: "" };
      try {
        new URL(value);
        return { isValid: true, message: "" };
      } catch {
        return { isValid: false, message };
      }
    },
    severity: 'error',
  }),

  pattern: (regex, message) => ({
    validate: (value) => ({
      isValid: !value || regex.test(value),
      message,
    }),
    severity: 'error',
  }),

  custom: (validator) => ({
    validate: validator,
    severity: 'error',
  }),

  // Conflict mediation specific rules
  conflictDescription: () => ({
    validate: (value) => {
      if (!value) return { isValid: true, message: "" };
      const wordCount = value.trim().split(/\s+/).length;
      return {
        isValid: wordCount >= 10,
        message: wordCount < 10 ? ERROR_MESSAGES.VALIDATION.CONFLICT_DESCRIPTION_TOO_SHORT : "",
        suggestions: wordCount < 10 ? [
          "Include specific details about what happened",
          "Describe the sequence of events",
          "Mention the people involved and their actions",
          "Add context about when and where it occurred"
        ] : []
      };
    },
    severity: 'warning',
  }),

  assertiveApproach: () => ({
    validate: (value) => {
      if (!value) return { isValid: true, message: "" };
      const hasIStatement = /I\s+(think|feel|believe|want|need)/i.test(value);
      const hasRespectfulTone = !/(you\s+(always|never|should|must)|stupid|idiot|wrong)/i.test(value);
      
      if (!hasIStatement) {
        return {
          isValid: false,
          message: ERROR_MESSAGES.VALIDATION.ASSERTIVE_APPROACH_MISSING_I_STATEMENT,
          suggestions: [
            "Start with 'I think...' or 'I feel...'",
            "Express your own perspective, not assumptions about others",
            "Focus on your needs and feelings",
            "Example: 'I feel frustrated when...' instead of 'You always...'"
          ]
        };
      }
      
      if (!hasRespectfulTone) {
        return {
          isValid: false,
          message: ERROR_MESSAGES.VALIDATION.ASSERTIVE_APPROACH_DISRESPECTFUL,
          suggestions: [
            "Avoid words like 'always', 'never', 'should', 'must'",
            "Don't use blaming or judgmental language",
            "Focus on the behavior, not the person",
            "Use neutral, descriptive language"
          ]
        };
      }
      
      return { isValid: true, message: "" };
    },
    severity: 'error',
  }),

  actionStep: () => ({
    validate: (value) => {
      if (!value) return { isValid: true, message: "" };
      const hasDeadline = /\b(by|before|on|until)\b|\d{1,2}\/\d{1,2}|\d{4}/.test(value);
      const isSpecific = value.length > 20;
      
      if (!isSpecific) {
        return {
          isValid: false,
          message: ERROR_MESSAGES.VALIDATION.ACTION_STEP_TOO_VAGUE,
          suggestions: [
            "Specify exactly what needs to be done",
            "Include who is responsible for the action",
            "Describe the expected outcome",
            "Example: 'John will send the report to Sarah by Friday'"
          ]
        };
      }
      
      if (!hasDeadline) {
        return {
          isValid: false,
          message: ERROR_MESSAGES.VALIDATION.ACTION_STEP_MISSING_DEADLINE,
          suggestions: [
            "Add a specific date or time frame",
            "Use phrases like 'by Friday' or 'within one week'",
            "Consider using calendar dates",
            "Make sure the deadline is realistic"
          ]
        };
      }
      
      return { isValid: true, message: "" };
    },
    severity: 'warning',
  }),

  // Enhanced validation rules with better error messages
  partyName: () => ({
    validate: (value) => {
      if (!value) return { isValid: true, message: "" };
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        return {
          isValid: false,
          message: "Please enter a valid name (at least 2 characters)",
          suggestions: ["Use the person's first name or preferred name", "Avoid nicknames or abbreviations"]
        };
      }
      if (!/^[a-zA-Z\s\-'.]+$/.test(trimmed)) {
        return {
          isValid: false,
          message: "Name contains invalid characters",
          suggestions: ["Use only letters, spaces, hyphens, apostrophes, and periods", "Avoid numbers and special symbols"]
        };
      }
      return { isValid: true, message: "" };
    },
    severity: 'error',
  }),

  thoughts: () => ({
    validate: (value) => {
      if (!value) return { isValid: true, message: "" };
      const wordCount = value.trim().split(/\s+/).length;
      if (wordCount < 5) {
        return {
          isValid: false,
          message: "Please provide more detailed thoughts (at least 5 words)",
          suggestions: [
            "Explain what you think happened",
            "Describe your perspective on the situation",
            "Include your assumptions or beliefs",
            "Be honest about your feelings and thoughts"
          ]
        };
      }
      return { isValid: true, message: "" };
    },
    severity: 'warning',
  }),

  miracleQuestion: () => ({
    validate: (value) => {
      if (!value) return { isValid: true, message: "" };
      const wordCount = value.trim().split(/\s+/).length;
      if (wordCount < 10) {
        return {
          isValid: false,
          message: "Please provide a more detailed response (at least 10 words)",
          suggestions: [
            "Describe what would be different in your ideal resolution",
            "Include specific changes you would notice",
            "Think about how both parties would feel",
            "Consider practical improvements to the situation"
          ]
        };
      }
      return { isValid: true, message: "" };
    },
    severity: 'warning',
  }),
};

export default InputValidation;