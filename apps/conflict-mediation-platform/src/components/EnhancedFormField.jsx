import React, { useState, useRef, useEffect } from "react";
import { Check, X, AlertCircle, HelpCircle, Eye, EyeOff, Lightbulb } from "lucide-react";
import { cn } from "../lib/utils";
import { SmartSuggestions, ContextualHelp } from "./SmartSuggestions";

const EnhancedFormField = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = "input",
  rows = 3,
  className = "",
  description = "",
  error = "",
  required = false,
  maxLength,
  minLength,
  pattern,
  validationMessage = "",
  showCharacterCount = false,
  autoSave = false,
  autoSaveDelay = 2000,
  suggestions = [],
  onSuggestionSelect,
  helpText = "",
  disabled = false,
  readOnly = false,
  smartSuggestions = false,
  fieldType = "",
  context = {},
  showContextualHelp = false,
  step = 1,
  variant = "enhanced",
  labelClassName = "",
  containerClassName = "",
  containerStyle = {},
  containerProps = {},
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationState, setValidationState] = useState("idle"); // idle, validating, valid, invalid
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle"); // idle, saving, saved, error
  const inputRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && value && value.trim() !== "") {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        setAutoSaveStatus("saving");
        // Simulate auto-save
        setTimeout(() => {
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 500);
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [value, autoSave, autoSaveDelay]);

  // Validation
  const validateField = (val) => {
    if (!val && !required) return true;
    if (required && (!val || val.trim() === "")) return false;
    if (minLength && val.length < minLength) return false;
    if (maxLength && val.length > maxLength) return false;
    if (pattern && !new RegExp(pattern).test(val)) return false;
    return true;
  };

  const handleChange = (newValue) => {
    onChange(newValue);
    
    if (validationMessage) {
      setIsValidating(true);
      setValidationState("validating");
      
      setTimeout(() => {
        const isValid = validateField(newValue);
        setValidationState(isValid ? "valid" : "invalid");
        setIsValidating(false);
      }, 300);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0 || smartSuggestions) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion) => {
    handleChange(suggestion);
    setShowSuggestions(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const getInputType = () => {
    if (type === "password") {
      return showPassword ? "text" : "password";
    }
    return type;
  };

  const inputProps = {
    id,
    ref: inputRef,
    className: cn(
      "form-input w-full transition-all duration-200",
      error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
      validationState === "valid" && !error && "border-green-500 focus:border-green-500 focus:ring-green-500/20",
      isFocused && "ring-2 ring-primary/20",
      disabled && "opacity-50 cursor-not-allowed",
      readOnly && "bg-muted cursor-default",
      className
    ),
    placeholder,
    value: value ?? "",
    onChange: (e) => handleChange(e.target.value),
    onFocus: handleFocus,
    onBlur: handleBlur,
    disabled,
    readOnly,
    "aria-invalid": !!error || validationState === "invalid",
    "aria-describedby": [
      error && `${id}-error`,
      description && `${id}-description`,
      helpText && `${id}-help`,
      showCharacterCount && `${id}-count`
    ].filter(Boolean).join(" "),
    maxLength,
    minLength,
    pattern,
    ...props
  };

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <textarea
          {...inputProps}
          rows={rows}
          className={cn(inputProps.className, "form-textarea resize-none")}
        />
      );
    }
    
    return <input {...inputProps} type={getInputType()} />;
  };

  const renderValidationIcon = () => {
    if (isValidating) {
      return <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />;
    }
    
    if (validationState === "valid") {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    
    if (validationState === "invalid") {
      return <X className="h-4 w-4 text-red-500" />;
    }
    
    return null;
  };

  const renderAutoSaveStatus = () => {
    if (!autoSave) return null;
    
    switch (autoSaveStatus) {
      case "saving":
        return <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />;
      case "saved":
        return <Check className="h-3 w-3 text-green-500" />;
      case "error":
        return <X className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "form-field",
        variant === "enhanced" ? "space-y-2" : "space-y-1",
        containerClassName
      )}
      style={containerStyle}
      {...containerProps}
    >
      {variant === "enhanced" ? (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className={cn(
              "form-label",
              required && "after:content-['*'] after:text-red-500 after:ml-1",
              labelClassName
            )}
          >
            {label}
          </label>
          <div className="flex items-center gap-2">
            {renderValidationIcon()}
            {renderAutoSaveStatus()}
            {helpText && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={helpText}
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            )}
            {smartSuggestions && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Smart suggestions available"
              >
                <Lightbulb className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "form-label",
            required && "after:content-['*'] after:text-red-500 after:ml-1",
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      {description && (
        <p
          id={`${id}-description`}
          className={cn(
            "form-description text-sm text-muted-foreground",
            variant === "simple" && "text-xs"
          )}
        >
          {description}
        </p>
      )}

      <div className="relative">
        {renderInput()}
        
        {type === "password" && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Smart Suggestions */}
      {smartSuggestions && fieldType && (
        <SmartSuggestions
          fieldType={fieldType}
          currentValue={value}
          context={context}
          onSuggestionSelect={handleSuggestionClick}
        />
      )}

      {/* Contextual Help */}
      {showContextualHelp && fieldType && (
        <ContextualHelp
          fieldType={fieldType}
          step={step}
          context={context}
        />
      )}

      {variant === "enhanced" ? (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            {error && (
              <p id={`${id}-error`} className="text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            {validationMessage && validationState === "invalid" && (
              <p className="text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationMessage}
              </p>
            )}
          </div>

          {showCharacterCount && maxLength && (
            <span
              id={`${id}-count`}
              className={cn(
                "text-muted-foreground transition-all",
                value && value.length > maxLength * 0.9 && "text-orange-500",
                value && value.length >= maxLength && "text-red-500 animate-shake font-medium"
              )}
            >
              {value?.length || 0}/{maxLength}
            </span>
          )}
        </div>
      ) : (
        <>
          {error && (
            <p id={`${id}-error`} className="text-red-600 mt-1 text-xs">
              {error}
            </p>
          )}
          {validationMessage && validationState === "invalid" && (
            <p className="text-red-600 mt-1 text-xs">
              {validationMessage}
            </p>
          )}
          {showCharacterCount && maxLength && (
            <span
              id={`${id}-count`}
              className={cn(
                "block text-right text-muted-foreground text-xs transition-all",
                value && value.length > maxLength * 0.9 && "text-orange-500",
                value && value.length >= maxLength && "text-red-500 animate-shake font-medium"
              )}
            >
              {value?.length || 0}/{maxLength}
            </span>
          )}
        </>
      )}

      {helpText && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default EnhancedFormField;