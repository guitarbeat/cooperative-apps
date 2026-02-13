import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { createError, logError, ERROR_TYPES, ERROR_SEVERITY } from "../utils/errorMessages";

/**
 * Custom hook for comprehensive error handling
 * Provides error state management, retry mechanisms, and user feedback
 */
export const useErrorHandler = (options = {}) => {
  const {
    showToast = true,
    logErrors = true,
    maxRetries = 3,
    retryDelay = 1000,
    onError = null
  } = options;

  const [errors, setErrors] = useState([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryCountRef = useRef({});

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
    retryCountRef.current = {};
  }, []);

  // Clear specific error
  const clearError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.errorId !== errorId));
    delete retryCountRef.current[errorId];
  }, []);

  // Handle error with retry logic
  const handleError = useCallback((error, context = {}) => {
    const errorId = error.errorId || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log error if enabled
    if (logErrors) {
      logError(error, context);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, context);
    }

    // Show toast notification if enabled
    if (showToast) {
      const toastMessage = error.message || "An error occurred";
      const toastType = error.severity === ERROR_SEVERITY.CRITICAL || error.severity === ERROR_SEVERITY.HIGH 
        ? "error" 
        : "warning";
      
      toast[toastType](toastMessage);
    }

    // Add error to state
    setErrors(prev => [
      ...prev.filter(e => e.errorId !== errorId),
      { ...error, errorId, context, timestamp: new Date().toISOString() }
    ]);

    return errorId;
  }, [showToast, logErrors, onError]);

  // Retry function with exponential backoff
  const retry = useCallback(async (errorId, retryFunction, retryContext = {}) => {
    const currentRetryCount = retryCountRef.current[errorId] || 0;
    
    if (currentRetryCount >= maxRetries) {
      const maxRetriesError = createError(ERROR_TYPES.UNKNOWN, 'MAX_RETRIES_EXCEEDED', ERROR_SEVERITY.HIGH, {
        details: `Maximum retry attempts (${maxRetries}) exceeded`,
        originalErrorId: errorId
      });
      handleError(maxRetriesError, retryContext);
      return false;
    }

    setIsRetrying(true);
    retryCountRef.current[errorId] = currentRetryCount + 1;

    try {
      // Wait with exponential backoff
      const delay = retryDelay * Math.pow(2, currentRetryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Execute retry function
      const result = await retryFunction();
      
      // Clear error on successful retry
      clearError(errorId);
      setIsRetrying(false);
      
      if (showToast) {
        toast.success("Operation completed successfully");
      }
      
      return result;
    } catch (retryError) {
      setIsRetrying(false);
      
      // Handle retry error
      const retryErrorObj = createError(ERROR_TYPES.UNKNOWN, 'RETRY_FAILED', ERROR_SEVERITY.MEDIUM, {
        details: `Retry attempt ${currentRetryCount + 1} failed`,
        originalError: retryError.message,
        retryCount: currentRetryCount + 1
      });
      
      handleError(retryErrorObj, { ...retryContext, retryCount: currentRetryCount + 1 });
      return false;
    }
  }, [maxRetries, retryDelay, handleError, clearError, showToast]);

  // Async operation wrapper with error handling
  const executeAsync = useCallback(async (asyncFunction, context = {}) => {
    try {
      const result = await asyncFunction();
      return { success: true, data: result, error: null };
    } catch (error) {
      const errorObj = createError(ERROR_TYPES.UNKNOWN, 'ASYNC_OPERATION_FAILED', ERROR_SEVERITY.MEDIUM, {
        details: error.message || "Async operation failed",
        originalError: error.message,
        context
      });
      
      const errorId = handleError(errorObj, context);
      return { success: false, data: null, error: errorObj, errorId };
    }
  }, [handleError]);

  // Network request wrapper
  const executeRequest = useCallback(async (requestFunction, context = {}) => {
    try {
      const response = await requestFunction();
      return { success: true, data: response, error: null };
    } catch (error) {
      let errorType = ERROR_TYPES.NETWORK;
      let errorKey = 'CONNECTION_FAILED';
      let severity = ERROR_SEVERITY.MEDIUM;

      // Determine error type based on error properties
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorKey = 'CONNECTION_FAILED';
      } else if (error.status >= 500) {
        errorKey = 'SERVER_ERROR';
        severity = ERROR_SEVERITY.HIGH;
      } else if (error.status === 401) {
        errorKey = 'UNAUTHORIZED';
      } else if (error.status === 403) {
        errorKey = 'FORBIDDEN';
      } else if (error.status === 404) {
        errorKey = 'NOT_FOUND';
      } else if (error.status === 429) {
        errorKey = 'RATE_LIMITED';
      }

      const errorObj = createError(errorType, errorKey, severity, {
        details: error.message || "Network request failed",
        statusCode: error.status,
        context
      });
      
      const errorId = handleError(errorObj, context);
      return { success: false, data: null, error: errorObj, errorId };
    }
  }, [handleError]);

  // File operation wrapper
  const executeFileOperation = useCallback(async (fileFunction, context = {}) => {
    try {
      const result = await fileFunction();
      return { success: true, data: result, error: null };
    } catch (error) {
      let errorKey = 'READ_ERROR';
      
      if (error.name === 'NotAllowedError') {
        errorKey = 'PERMISSION_DENIED';
      } else if (error.name === 'NotFoundError') {
        errorKey = 'FILE_CORRUPTED';
      } else if (error.message.includes('too large')) {
        errorKey = 'FILE_TOO_LARGE';
      } else if (error.message.includes('type')) {
        errorKey = 'INVALID_FILE_TYPE';
      }

      const errorObj = createError(ERROR_TYPES.FILE_OPERATION, errorKey, ERROR_SEVERITY.MEDIUM, {
        details: error.message || "File operation failed",
        originalError: error.message,
        context
      });
      
      const errorId = handleError(errorObj, context);
      return { success: false, data: null, error: errorObj, errorId };
    }
  }, [handleError]);

  // Get errors by type
  const getErrorsByType = useCallback((type) => {
    return errors.filter(error => error.type === type);
  }, [errors]);

  // Get errors by severity
  const getErrorsBySeverity = useCallback((severity) => {
    return errors.filter(error => error.severity === severity);
  }, [errors]);

  // Check if there are any critical errors
  const hasCriticalErrors = errors.some(error => error.severity === ERROR_SEVERITY.CRITICAL);

  // Check if there are any errors
  const hasErrors = errors.length > 0;

  return {
    // State
    errors,
    isRetrying,
    hasErrors,
    hasCriticalErrors,
    
    // Actions
    handleError,
    clearErrors,
    clearError,
    retry,
    
    // Async wrappers
    executeAsync,
    executeRequest,
    executeFileOperation,
    
    // Utilities
    getErrorsByType,
    getErrorsBySeverity
  };
};

export default useErrorHandler;