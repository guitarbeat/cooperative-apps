import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, Clock, Shield, XCircle, AlertCircle, Info, AlertOctagon } from 'lucide-react';
import { AppError, getErrorDisplayInfo, ErrorType } from '../../utils/errorHandling';
import { getVersionInfo, getCompactVersion } from '../../utils/version';

interface ErrorDisplayProps {
  error: AppError | Error;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
  showDetails?: boolean;
}

const getErrorIcon = (errorType: ErrorType, severity?: 'low' | 'medium' | 'high') => {
  const iconClass = "w-6 h-6";
  
  switch (errorType) {
    case ErrorType.NETWORK:
      return <WifiOff className={iconClass} />;
    case ErrorType.TIMEOUT:
      return <Clock className={iconClass} />;
    case ErrorType.AUTHENTICATION:
    case ErrorType.AUTHORIZATION:
      return <Shield className={iconClass} />;
    case ErrorType.VALIDATION:
      return <XCircle className={iconClass} />;
    case ErrorType.SERVER:
      return severity === 'high' ? <AlertOctagon className={iconClass} /> : <AlertCircle className={iconClass} />;
    default:
      return severity === 'high' ? <AlertOctagon className={iconClass} /> : <AlertTriangle className={iconClass} />;
  }
};

const getErrorColor = (errorType: ErrorType, _severity?: 'low' | 'medium' | 'high') => {
  const baseColors = {
    [ErrorType.NETWORK]: 'text-warning bg-warning-light border-warning',
    [ErrorType.TIMEOUT]: 'text-warning bg-warning-light border-warning',
    [ErrorType.AUTHENTICATION]: 'text-destructive bg-destructive-light border-destructive',
    [ErrorType.AUTHORIZATION]: 'text-destructive bg-destructive-light border-destructive',
    [ErrorType.VALIDATION]: 'text-info bg-info-light border-info',
    [ErrorType.SERVER]: 'text-destructive bg-destructive-light border-destructive',
    [ErrorType.NOT_FOUND]: 'text-accent bg-accent-light border-accent',
    [ErrorType.CONFLICT]: 'text-warning bg-warning-light border-warning',
    [ErrorType.UNKNOWN]: 'text-muted-foreground bg-muted border-border'
  };

  return baseColors[errorType] || baseColors[ErrorType.UNKNOWN];
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onGoHome,
  className = '',
  showDetails = false
}) => {
  const errorInfo = getErrorDisplayInfo(error);
  const errorType = error instanceof AppError ? error.details.type : ErrorType.UNKNOWN;
  const isRetryable = error instanceof AppError ? error.details.retryable : true;
  const severity = error instanceof AppError ? error.details.severity : 'medium';

  return (
    <div className={`rounded-lg border p-4 ${getErrorColor(errorType, severity)} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getErrorIcon(errorType, severity)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium">
              {errorInfo.title}
            </h3>
            {severity && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                severity === 'high' ? 'bg-destructive text-destructive-foreground' :
                severity === 'medium' ? 'bg-warning text-warning-foreground' :
                'bg-info text-info-foreground'
              }`}>
                {severity.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-sm mb-3">
            {errorInfo.description}
          </p>
          
          {errorInfo.action && (
            <div className="flex items-start space-x-2 mb-3">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs opacity-90">
                {errorInfo.action}
              </p>
            </div>
          )}

          {showDetails && (
            <details className="text-xs opacity-75 mb-3">
              <summary className="cursor-pointer hover:opacity-100 flex items-center">
                <span>Technical Details</span>
                <span className="ml-1 text-xs">▼</span>
              </summary>
              <div className="mt-2 space-y-1 bg-muted/50 p-2 rounded">
                {error instanceof AppError && (
                  <>
                    <div><strong>Code:</strong> {error.details.code}</div>
                    <div><strong>Type:</strong> {error.details.type}</div>
                    <div><strong>Severity:</strong> {severity}</div>
                    <div><strong>Retryable:</strong> {isRetryable ? 'Yes' : 'No'}</div>
                    <div><strong>Timestamp:</strong> {new Date(error.details.timestamp).toLocaleString()}</div>
                    {error.details.originalError && (
                      <div><strong>Original Error:</strong> {error.details.originalError.message}</div>
                    )}
                    <hr className="my-2 border-border" />
                  </>
                )}
                {/* Version and build information */}
                {(() => {
                  const versionInfo = getVersionInfo();
                  const buildDate = new Date(versionInfo.buildTime).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <>
                      <div><strong>Version:</strong> {getCompactVersion()}</div>
                      <div><strong>Commit:</strong> {versionInfo.gitCommit}</div>
                      <div><strong>Branch:</strong> {versionInfo.gitBranch}</div>
                      <div><strong>Build Time:</strong> {buildDate}</div>
                      <div><strong>Environment:</strong> {versionInfo.environment}</div>
                    </>
                  );
                })()}
              </div>
            </details>
          )}

          <div className="flex gap-2 flex-wrap">
            {isRetryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-card/50 hover:bg-card/70 transition-colors border border-border"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Try Again
              </button>
            )}
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-card/50 hover:bg-card/70 transition-colors border border-border"
              >
                Go Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;