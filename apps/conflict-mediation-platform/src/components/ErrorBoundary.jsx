import React from "react";
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      errorId: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error info for display
    this.setState({ errorInfo });
    
    // In a real app, you might want to send this to an error reporting service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // This would typically send to a service like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // For now, just log to console
    console.error('Error details:', errorData);
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      this.setState({ copied: true });
      toast.success("Error details copied to clipboard");
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (error) {
      console.error("Failed to copy error details:", error);
      toast.error("Failed to copy error details");
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId, retryCount, copied } = this.state;
      const isRetryable = retryCount < 3;

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-2xl w-full space-y-6">
            {/* Error Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Oops! Something went wrong</h1>
                <p className="text-muted-foreground mt-2">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>
              </div>
            </div>

            {/* Error Details */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Error Details</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">ID: {errorId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.handleCopyError}
                    className="h-6 px-2 text-xs"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Error:</span>
                  <p className="text-sm font-mono bg-background p-2 rounded border">
                    {error?.message || "Unknown error occurred"}
                  </p>
                </div>
                
                {retryCount > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Retry attempts:</span>
                    <p className="text-sm">{retryCount}/3</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isRetryable && (
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              )}
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                If this problem persists, please contact support with the error ID above.
              </p>
              {!isRetryable && (
                <p className="text-sm text-destructive">
                  Maximum retry attempts reached. Please refresh the page or contact support.
                </p>
              )}
            </div>

            {/* Debug Info (only in development) */}
            {import.meta.env.DEV && error?.stack && (
              <details className="bg-muted/30 border border-border rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-sm mb-2 flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Debug Information (Development Only)
                </summary>
                <pre className="text-xs font-mono bg-background p-3 rounded border overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;