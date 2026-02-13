import React from "react";
import { AlertTriangle, XCircle, AlertCircle, Info, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const ErrorDisplay = ({
  error,
  onRetry,
  onDismiss,
  showRecoverySuggestions = true,
  className = "",
  variant = "default" // default, inline, toast
}) => {
  if (!error) return null;

  const { message, suggestions = [], severity = "medium", type, errorId } = error;

  const getIcon = () => {
    switch (severity) {
      case "critical":
      case "high":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityStyles = () => {
    switch (severity) {
      case "critical":
      case "high":
        return "border-red-200 bg-red-50 text-red-900";
      case "medium":
        return "border-yellow-200 bg-yellow-50 text-yellow-900";
      case "low":
        return "border-blue-200 bg-blue-50 text-blue-900";
      default:
        return "border-muted-foreground/20 bg-muted/50 text-muted-foreground";
    }
  };

  const renderSuggestions = () => {
    if (!showRecoverySuggestions || !suggestions || suggestions.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium">Suggestions:</p>
        <ul className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="text-xs flex items-start gap-1">
              <span className="text-muted-foreground mt-0.5">•</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderErrorId = () => {
    if (!errorId || variant === "toast") return null;
    
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        Error ID: <code className="font-mono">{errorId}</code>
      </div>
    );
  };

  if (variant === "toast") {
    return (
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
          {suggestions && suggestions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {suggestions[0]}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-start gap-2 text-sm", className)}>
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p>{message}</p>
          {renderSuggestions()}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg border p-4",
      getSeverityStyles(),
      className
    )}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">
            {type === "validation" ? "Validation Error" : 
             type === "network" ? "Connection Error" :
             type === "storage" ? "Storage Error" :
             type === "file_operation" ? "File Error" :
             type === "pdf_generation" ? "PDF Generation Error" :
             "Error"}
          </h3>
          <p className="mt-1 text-sm">{message}</p>
          
          {renderSuggestions()}
          {renderErrorId()}
        </div>
        
        <div className="flex items-center gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8 px-3 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 px-2 text-xs"
            >
              <XCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Error boundary fallback component
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <ErrorDisplay
          error={error}
          onRetry={resetErrorBoundary}
          variant="default"
        />
      </div>
    </div>
  );
};

// Loading error component
export const LoadingError = ({ onRetry, message = "Failed to load data" }) => {
  const error = {
    message,
    type: "network",
    severity: "medium",
    suggestions: [
      "Check your internet connection",
      "Try refreshing the page",
      "Contact support if the problem persists"
    ]
  };

  return (
    <div className="flex items-center justify-center p-8">
      <ErrorDisplay
        error={error}
        onRetry={onRetry}
        variant="default"
      />
    </div>
  );
};

// Validation error component
export const ValidationError = ({ fieldName, message, suggestions = [] }) => {
  const error = {
    message: fieldName ? `${fieldName}: ${message}` : message,
    type: "validation",
    severity: "medium",
    suggestions
  };

  return (
    <ErrorDisplay
      error={error}
      variant="inline"
      className="text-red-600"
    />
  );
};

export default ErrorDisplay;