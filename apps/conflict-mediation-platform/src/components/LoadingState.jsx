import React from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const LoadingState = ({
  isLoading = false,
  error = null,
  onRetry = null,
  message = "Loading...",
  className = "",
  size = "default" // sm, default, lg
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          icon: "h-4 w-4",
          text: "text-sm",
          button: "h-8 px-3 text-xs"
        };
      case "lg":
        return {
          icon: "h-8 w-8",
          text: "text-lg",
          button: "h-12 px-6 text-base"
        };
      default:
        return {
          icon: "h-6 w-6",
          text: "text-base",
          button: "h-10 px-4 text-sm"
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-4 p-6", className)}>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className={sizeClasses.icon} />
          <span className={sizeClasses.text}>Error loading data</span>
        </div>
        
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error.message || "Something went wrong while loading the data."}
        </p>
        
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className={sizeClasses.button}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (!isLoading) {
    return null;
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4 p-6", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses.icon)} />
      <p className={cn("text-muted-foreground", sizeClasses.text)}>
        {message}
      </p>
    </div>
  );
};

// Specific loading states for different operations
export const PDFLoadingState = ({ isLoading, error, onRetry }) => (
  <LoadingState
    isLoading={isLoading}
    error={error}
    onRetry={onRetry}
    message="Generating PDF report..."
    size="lg"
  />
);

export const FileLoadingState = ({ isLoading, error, onRetry }) => (
  <LoadingState
    isLoading={isLoading}
    error={error}
    onRetry={onRetry}
    message="Processing file..."
    size="default"
  />
);

export const FormLoadingState = ({ isLoading, error, onRetry }) => (
  <LoadingState
    isLoading={isLoading}
    error={error}
    onRetry={onRetry}
    message="Saving form data..."
    size="sm"
  />
);

// Inline loading indicator
export const InlineLoading = ({ isLoading, message = "Loading..." }) => {
  if (!isLoading) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
};

// Button loading state
export const ButtonLoading = ({ isLoading, children, loadingText = "Loading...", ...props }) => (
  <Button disabled={isLoading} {...props}>
    {isLoading ? (
      <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        {loadingText}
      </>
    ) : (
      children
    )}
  </Button>
);

export default LoadingState;