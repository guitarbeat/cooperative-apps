/**
 * Centralized error messages and utilities for the Conflict Resolution Platform
 */

// Error message categories
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  STORAGE: 'storage',
  FILE_OPERATION: 'file_operation',
  PDF_GENERATION: 'pdf_generation',
  FORM_SUBMISSION: 'form_submission',
  NAVIGATION: 'navigation',
  UNKNOWN: 'unknown'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Base error messages
export const ERROR_MESSAGES = {
  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: (fieldName) => `${fieldName} is required`,
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    INVALID_URL: 'Please enter a valid URL',
    MIN_LENGTH: (min) => `Must be at least ${min} characters long`,
    MAX_LENGTH: (max) => `Must be no more than ${max} characters long`,
    INVALID_PATTERN: 'Please enter a valid format',
    CONFLICT_DESCRIPTION_TOO_SHORT: 'Please provide a more detailed description (at least 10 words)',
    ASSERTIVE_APPROACH_MISSING_I_STATEMENT: 'Try using "I" statements to express your needs respectfully',
    ASSERTIVE_APPROACH_DISRESPECTFUL: 'Please use respectful language and avoid blaming statements',
    ACTION_STEP_TOO_VAGUE: 'Please be more specific about the action to be taken',
    ACTION_STEP_MISSING_DEADLINE: 'Consider adding a deadline or timeline for this action',
    STEP_INCOMPLETE: (stepNumber) => `Please complete all required fields in Step ${stepNumber} before continuing`,
    FIELD_INCOMPLETE: (fieldName) => `Please complete the ${fieldName} field`
  },

  // Network errors
  NETWORK: {
    CONNECTION_FAILED: 'Unable to connect to the server. Please check your internet connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FORBIDDEN: 'Access denied. Please contact support if you believe this is an error.',
    NOT_FOUND: 'The requested resource was not found.',
    RATE_LIMITED: 'Too many requests. Please wait a moment before trying again.'
  },

  // Storage errors
  STORAGE: {
    SAVE_FAILED: 'Failed to save your progress. Please try again.',
    LOAD_FAILED: 'Failed to load saved data. Starting with a fresh session.',
    CLEAR_FAILED: 'Failed to clear saved data. Please try again.',
    QUOTA_EXCEEDED: 'Storage quota exceeded. Please clear some data and try again.',
    CORRUPTED_DATA: 'Saved data appears to be corrupted. Starting with a fresh session.',
    UNAVAILABLE: 'Local storage is not available. Your progress will not be saved automatically.'
  },

  // File operation errors
  FILE_OPERATION: {
    IMPORT_FAILED: 'Failed to import file. Please check the file format and try again.',
    EXPORT_FAILED: 'Failed to export data. Please try again.',
    INVALID_FILE_TYPE: 'Invalid file type. Please select a valid JSON file.',
    FILE_TOO_LARGE: 'File is too large. Please select a smaller file.',
    FILE_CORRUPTED: 'The selected file appears to be corrupted or invalid.',
    PERMISSION_DENIED: 'Permission denied to access the file. Please try again.',
    READ_ERROR: 'Unable to read the file. Please ensure the file is not open in another application.'
  },

  // PDF generation errors
  PDF_GENERATION: {
    GENERATION_FAILED: 'Failed to generate PDF. Please try again.',
    INSUFFICIENT_DATA: 'Insufficient data to generate PDF. Please complete more fields.',
    BROWSER_NOT_SUPPORTED: 'Your browser does not support PDF generation. Please try a different browser.',
    MEMORY_ERROR: 'Not enough memory to generate PDF. Please try closing other tabs and try again.',
    TIMEOUT: 'PDF generation timed out. Please try again with less data.'
  },

  // Form submission errors
  FORM_SUBMISSION: {
    SUBMISSION_FAILED: 'Failed to submit form. Please try again.',
    VALIDATION_FAILED: 'Please correct the errors below before submitting.',
    DUPLICATE_SUBMISSION: 'Form has already been submitted. Please refresh the page.',
    SESSION_EXPIRED: 'Your session has expired. Please refresh the page and try again.'
  },

  // Navigation errors
  NAVIGATION: {
    INVALID_STEP: 'Invalid step number. Redirecting to the first step.',
    STEP_NOT_ACCESSIBLE: 'This step is not yet accessible. Please complete previous steps first.',
    NAVIGATION_BLOCKED: 'Navigation is temporarily blocked. Please wait a moment.',
    BROWSER_BACK_DISABLED: 'Browser back button is disabled during form completion.'
  },

  // Generic errors
  GENERIC: {
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
    OPERATION_FAILED: 'Operation failed. Please try again.',
    FEATURE_UNAVAILABLE: 'This feature is temporarily unavailable. Please try again later.',
    MAINTENANCE_MODE: 'The application is currently under maintenance. Please try again later.'
  }
};

// Error recovery suggestions
export const ERROR_RECOVERY_SUGGESTIONS = {
  [ERROR_TYPES.VALIDATION]: [
    'Check that all required fields are filled out correctly',
    'Ensure your input meets the minimum requirements',
    'Try refreshing the page if validation seems incorrect'
  ],
  [ERROR_TYPES.NETWORK]: [
    'Check your internet connection',
    'Try refreshing the page',
    'Wait a few moments and try again',
    'Contact support if the problem persists'
  ],
  [ERROR_TYPES.STORAGE]: [
    'Try refreshing the page',
    'Clear your browser cache and cookies',
    'Check if you have sufficient storage space',
    'Try using a different browser'
  ],
  [ERROR_TYPES.FILE_OPERATION]: [
    'Check that the file format is correct',
    'Ensure the file is not corrupted',
    'Try selecting a different file',
    'Check file permissions'
  ],
  [ERROR_TYPES.PDF_GENERATION]: [
    'Try closing other browser tabs to free up memory',
    'Complete more form fields before generating PDF',
    'Try using a different browser',
    'Wait a moment and try again'
  ]
};

// Error message formatter
export const formatErrorMessage = (errorType, errorKey, ...params) => {
  const errorCategory = ERROR_MESSAGES[errorType];
  if (!errorCategory || !errorCategory[errorKey]) {
    return ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR;
  }
  
  const message = errorCategory[errorKey];
  return typeof message === 'function' ? message(...params) : message;
};

// Get recovery suggestions for an error type
export const getRecoverySuggestions = (errorType) => {
  return ERROR_RECOVERY_SUGGESTIONS[errorType] || [
    'Try refreshing the page',
    'Contact support if the problem persists'
  ];
};

// Create a structured error object
export const createError = (type, key, severity = ERROR_SEVERITY.MEDIUM, details = {}) => {
  const message = formatErrorMessage(type, key, ...(details.params || []));
  const suggestions = getRecoverySuggestions(type);
  
  return {
    type,
    key,
    severity,
    message,
    suggestions,
    timestamp: new Date().toISOString(),
    errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...details
  };
};

// Validation error helpers
export const createValidationError = (fieldName, errorKey, ...params) => {
  return createError(ERROR_TYPES.VALIDATION, errorKey, ERROR_SEVERITY.MEDIUM, {
    fieldName,
    params
  });
};

// Network error helpers
export const createNetworkError = (statusCode, errorKey = 'SERVER_ERROR') => {
  const severity = statusCode >= 500 ? ERROR_SEVERITY.HIGH : ERROR_SEVERITY.MEDIUM;
  return createError(ERROR_TYPES.NETWORK, errorKey, severity, {
    statusCode
  });
};

// Storage error helpers
export const createStorageError = (operation, errorKey) => {
  return createError(ERROR_TYPES.STORAGE, errorKey, ERROR_SEVERITY.MEDIUM, {
    operation
  });
};

// File operation error helpers
export const createFileError = (operation, errorKey, fileName = null) => {
  return createError(ERROR_TYPES.FILE_OPERATION, errorKey, ERROR_SEVERITY.MEDIUM, {
    operation,
    fileName
  });
};

// PDF generation error helpers
export const createPDFError = (errorKey, details = {}) => {
  return createError(ERROR_TYPES.PDF_GENERATION, errorKey, ERROR_SEVERITY.MEDIUM, details);
};

// Error logging utility
export const logError = (error, context = {}) => {
  const errorData = {
    ...error,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  // In development, log to console
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorData);
  }
  
  // In production, you might want to send to an error reporting service
  // Example: Sentry.captureException(errorData);
  
  return errorData;
};

// Error boundary error creator
export const createBoundaryError = (error, errorInfo) => {
  return createError(ERROR_TYPES.UNKNOWN, 'UNEXPECTED_ERROR', ERROR_SEVERITY.CRITICAL, {
    originalError: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack
  });
};