// Error handling utilities and constants
import { logProduction } from './productionLogger';

export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  SERVER = "SERVER",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
}

export enum ErrorCode {
  // Network errors
  CONNECTION_FAILED = "CONNECTION_FAILED",
  NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
  OFFLINE = "OFFLINE",
  WEBSOCKET_DISCONNECTED = "WEBSOCKET_DISCONNECTED",
  SERVER_UNREACHABLE = "SERVER_UNREACHABLE",

  // Validation errors
  INVALID_MEETING_CODE = "INVALID_MEETING_CODE",
  INVALID_PARTICIPANT_NAME = "INVALID_PARTICIPANT_NAME",
  INVALID_QUEUE_TYPE = "INVALID_QUEUE_TYPE",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_MEETING_TITLE = "INVALID_MEETING_TITLE",
  NAME_TOO_LONG = "NAME_TOO_LONG",
  NAME_TOO_SHORT = "NAME_TOO_SHORT",
  INVALID_CHARACTERS = "INVALID_CHARACTERS",

  // Authentication/Authorization errors
  UNAUTHORIZED_FACILITATOR = "UNAUTHORIZED_FACILITATOR",
  NOT_IN_MEETING = "NOT_IN_MEETING",
  MEETING_ACCESS_DENIED = "MEETING_ACCESS_DENIED",
  FACILITATOR_REQUIRED = "FACILITATOR_REQUIRED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  INVALID_ROLE = "INVALID_ROLE",
  WATCHER_CANNOT_JOIN_QUEUE = "WATCHER_CANNOT_JOIN_QUEUE",
  WATCHER_CANNOT_LEAVE_QUEUE = "WATCHER_CANNOT_LEAVE_QUEUE",

  // Not found errors
  MEETING_NOT_FOUND = "MEETING_NOT_FOUND",
  PARTICIPANT_NOT_FOUND = "PARTICIPANT_NOT_FOUND",
  QUEUE_ITEM_NOT_FOUND = "QUEUE_ITEM_NOT_FOUND",

  // Conflict errors
  ALREADY_IN_QUEUE = "ALREADY_IN_QUEUE",
  DUPLICATE_PARTICIPANT = "DUPLICATE_PARTICIPANT",
  MEETING_CODE_EXISTS = "MEETING_CODE_EXISTS",
  QUEUE_EMPTY = "QUEUE_EMPTY",
  PARTICIPANT_ALREADY_EXISTS = "PARTICIPANT_ALREADY_EXISTS",

  // Server errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  DATABASE_ERROR = "DATABASE_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Timeout errors
  JOIN_TIMEOUT = "JOIN_TIMEOUT",
  SOCKET_TIMEOUT = "SOCKET_TIMEOUT",
  REQUEST_TIMEOUT = "REQUEST_TIMEOUT",

  // Business logic errors
  MEETING_ENDED = "MEETING_ENDED",
  MEETING_FULL = "MEETING_FULL",
  INVALID_OPERATION = "INVALID_OPERATION",
  QUEUE_LIMIT_REACHED = "QUEUE_LIMIT_REACHED",

  // Generic errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTH_ERROR = "AUTH_ERROR",
  UNKNOWN = "UNKNOWN",
}

export interface ErrorDetails {
  type: ErrorType;
  code: ErrorCode;
  message: string;
  userMessage: string;
  action?: string;
  retryable: boolean;
  severity?: "low" | "medium" | "high";
  timestamp: string;
  originalError?: Error;
}

// User-friendly error messages
export const ERROR_MESSAGES: Record<
  ErrorCode,
  {
    title: string;
    description: string;
    action?: string;
    severity?: "low" | "medium" | "high";
  }
> = {
  // Network errors
  CONNECTION_FAILED: {
    title: "Connection Failed",
    description:
      "Unable to connect to the meeting server. This could be due to network issues or server maintenance.",
    action: "Check your internet connection and try refreshing the page.",
    severity: "high",
  },
  NETWORK_TIMEOUT: {
    title: "Connection Timeout",
    description:
      "The connection timed out. This might be due to a slow network or server issues.",
    action:
      "Try again or check your internet connection. If the problem persists, try using a different network.",
    severity: "medium",
  },
  OFFLINE: {
    title: "You're Offline",
    description: "Please check your internet connection and try again.",
    action: "Check your internet connection and refresh the page.",
    severity: "high",
  },
  WEBSOCKET_DISCONNECTED: {
    title: "Connection Lost",
    description:
      "Your connection to the meeting was lost. We're trying to reconnect you automatically.",
    action:
      "Wait for automatic reconnection or refresh the page if it takes too long.",
    severity: "medium",
  },
  SERVER_UNREACHABLE: {
    title: "Server Unreachable",
    description:
      "We can't reach our servers right now. This might be due to maintenance or a temporary outage.",
    action:
      "Please try again in a few minutes. Check our status page for updates.",
    severity: "high",
  },

  // Validation errors
  INVALID_MEETING_CODE: {
    title: "Invalid Meeting Code",
    description:
      "The meeting code you entered is not valid. Meeting codes are exactly 6 characters long.",
    action:
      "Double-check the meeting code and ensure it's exactly 6 characters. Ask the facilitator to share the code again.",
    severity: "low",
  },
  INVALID_PARTICIPANT_NAME: {
    title: "Invalid Name",
    description:
      "Please enter a valid name. Names should be 1-50 characters and contain only letters, numbers, and spaces.",
    action:
      "Enter a name between 1 and 50 characters using only letters, numbers, and spaces.",
    severity: "low",
  },
  INVALID_QUEUE_TYPE: {
    title: "Invalid Queue Type",
    description: "The queue type you selected is not supported.",
    action: "Try joining the speaking queue instead.",
    severity: "low",
  },
  MISSING_REQUIRED_FIELD: {
    title: "Missing Information",
    description: "Please fill in all required fields to continue.",
    action: "Complete all required fields and try again.",
    severity: "low",
  },
  INVALID_MEETING_TITLE: {
    title: "Invalid Meeting Title",
    description:
      "Please enter a valid meeting title. Titles should be 1-100 characters.",
    action: "Enter a meeting title between 1 and 100 characters.",
    severity: "low",
  },
  NAME_TOO_LONG: {
    title: "Name Too Long",
    description: "Your name is too long. Please keep it under 50 characters.",
    action: "Shorten your name to 50 characters or less.",
    severity: "low",
  },
  NAME_TOO_SHORT: {
    title: "Name Too Short",
    description: "Please enter a name with at least 1 character.",
    action: "Enter a name with at least 1 character.",
    severity: "low",
  },
  INVALID_CHARACTERS: {
    title: "Invalid Characters",
    description:
      "Your name contains invalid characters. Please use only letters, numbers, and spaces.",
    action:
      "Remove any special characters and use only letters, numbers, and spaces.",
    severity: "low",
  },

  // Authentication/Authorization errors
  UNAUTHORIZED_FACILITATOR: {
    title: "Access Denied",
    description:
      "Only the meeting creator can join as facilitator. You can join as a regular participant instead.",
    action:
      "Join as a regular participant or contact the meeting creator for facilitator access.",
    severity: "medium",
  },
  INVALID_ROLE: {
    title: "Invalid Role",
    description:
      "Cannot be both facilitator and watcher. Please choose one role.",
    action: "Select either facilitator or watcher role, not both.",
    severity: "low",
  },
  WATCHER_CANNOT_JOIN_QUEUE: {
    title: "Read-Only Access",
    description:
      "Watchers cannot join the speaking queue. You can only observe the meeting.",
    action:
      "Switch to participant mode if you want to join the speaking queue.",
    severity: "low",
  },
  WATCHER_CANNOT_LEAVE_QUEUE: {
    title: "Read-Only Access",
    description:
      "Watchers cannot leave the speaking queue as they cannot join it.",
    action:
      "Switch to participant mode if you want to manage your queue participation.",
    severity: "low",
  },
  NOT_IN_MEETING: {
    title: "Not in Meeting",
    description: "You must be in a meeting to perform this action.",
    action: "Join a meeting first.",
    severity: "medium",
  },
  MEETING_ACCESS_DENIED: {
    title: "Access Denied",
    description: "You don't have permission to access this meeting.",
    action:
      "Contact the meeting facilitator for access or check if you have the correct meeting code.",
    severity: "medium",
  },
  FACILITATOR_REQUIRED: {
    title: "Facilitator Required",
    description: "This action requires facilitator privileges.",
    action: "Only the meeting facilitator can perform this action.",
    severity: "medium",
  },
  INSUFFICIENT_PERMISSIONS: {
    title: "Insufficient Permissions",
    description:
      "You don't have the required permissions to perform this action.",
    action: "Contact the meeting facilitator for assistance.",
    severity: "medium",
  },

  // Not found errors
  MEETING_NOT_FOUND: {
    title: "Meeting Not Found",
    description:
      "The meeting code you entered doesn't exist or the meeting has ended.",
    action:
      "Check the meeting code or ask the facilitator for a new one. The meeting may have ended.",
    severity: "medium",
  },
  PARTICIPANT_NOT_FOUND: {
    title: "Participant Not Found",
    description: "The participant information could not be found.",
    action:
      "Try rejoining the meeting or contact the facilitator for assistance.",
    severity: "medium",
  },
  QUEUE_ITEM_NOT_FOUND: {
    title: "Queue Item Not Found",
    description: "The requested queue item could not be found.",
    action: "Try refreshing the page or rejoining the queue.",
    severity: "low",
  },

  // Conflict errors
  ALREADY_IN_QUEUE: {
    title: "Already in Queue",
    description:
      "You're already in the speaking queue. You can only be in one queue at a time.",
    action: "Wait for your turn or leave the current queue first.",
    severity: "low",
  },
  DUPLICATE_PARTICIPANT: {
    title: "Already Joined",
    description: "You've already joined this meeting with this name.",
    action:
      "You can continue participating in the meeting or try joining with a different name.",
    severity: "low",
  },
  MEETING_CODE_EXISTS: {
    title: "Meeting Code Already Exists",
    description:
      "A meeting with this code already exists. Please try creating a new meeting.",
    action:
      "Try creating a new meeting - a new code will be generated automatically.",
    severity: "low",
  },
  QUEUE_EMPTY: {
    title: "Queue is Empty",
    description: "There are no participants in the speaking queue.",
    action:
      "Wait for participants to join the queue or ask them to raise their hands.",
    severity: "low",
  },
  PARTICIPANT_ALREADY_EXISTS: {
    title: "Participant Already Exists",
    description: "A participant with this name already exists in the meeting.",
    action:
      "Try joining with a different name or ask the existing participant to leave.",
    severity: "low",
  },

  // Server errors
  INTERNAL_SERVER_ERROR: {
    title: "Server Error",
    description: "Something went wrong on our end. We're working to fix it.",
    action:
      "Please try again in a few moments. If the problem persists, contact support.",
    severity: "high",
  },
  SERVICE_UNAVAILABLE: {
    title: "Service Unavailable",
    description:
      "The meeting service is temporarily unavailable due to maintenance or high load.",
    action: "Please try again later. Check our status page for updates.",
    severity: "high",
  },
  DATABASE_ERROR: {
    title: "Database Error",
    description: "We're experiencing database issues. Your data is safe.",
    action:
      "Please try again in a few moments. If the problem persists, contact support.",
    severity: "high",
  },
  RATE_LIMIT_EXCEEDED: {
    title: "Rate Limit Exceeded",
    description:
      "You're making requests too quickly. Please slow down and try again.",
    action: "Wait a moment before trying again.",
    severity: "medium",
  },

  // Timeout errors
  JOIN_TIMEOUT: {
    title: "Join Timeout",
    description:
      "Joining the meeting took too long. This might be due to network issues.",
    action:
      "Try joining the meeting again. Check your internet connection if the problem persists.",
    severity: "medium",
  },
  SOCKET_TIMEOUT: {
    title: "Connection Timeout",
    description: "The connection timed out. Please try reconnecting.",
    action: "Refresh the page to reconnect.",
    severity: "medium",
  },
  REQUEST_TIMEOUT: {
    title: "Request Timeout",
    description: "Your request timed out. This might be due to network issues.",
    action: "Try again or check your internet connection.",
    severity: "medium",
  },

  // Business logic errors
  MEETING_ENDED: {
    title: "Meeting Ended",
    description: "This meeting has ended and is no longer available.",
    action:
      "Ask the facilitator to create a new meeting or check if you have the correct meeting code.",
    severity: "medium",
  },
  MEETING_FULL: {
    title: "Meeting Full",
    description: "This meeting has reached its maximum capacity.",
    action:
      "Ask the facilitator to increase the capacity or try joining later.",
    severity: "medium",
  },
  INVALID_OPERATION: {
    title: "Invalid Operation",
    description: "This operation is not allowed in the current context.",
    action: "Check the meeting state and try again.",
    severity: "low",
  },
  QUEUE_LIMIT_REACHED: {
    title: "Queue Limit Reached",
    description: "The speaking queue has reached its maximum capacity.",
    action:
      "Wait for someone to leave the queue or ask the facilitator to increase the limit.",
    severity: "low",
  },
  VALIDATION_ERROR: {
    title: "Validation Error",
    description: "The provided data is invalid.",
    action: "Check your input and try again.",
    severity: "low",
  },
  AUTH_ERROR: {
    title: "Authentication Error",
    description: "You are not authorized to perform this action.",
    action: "Please log in and try again.",
    severity: "medium",
  },
  UNKNOWN: {
    title: "Unknown Error",
    description: "An unexpected error occurred.",
    action: "Please try again. If the problem persists, contact support.",
    severity: "medium",
  },
};

export class AppError extends Error {
  public readonly details: ErrorDetails;

  constructor(code: ErrorCode, originalError?: Error, customMessage?: string) {
    const errorInfo = ERROR_MESSAGES[code];
    const message = customMessage ?? errorInfo.description;

    super(message);
    this.name = "AppError";

    const details: ErrorDetails = {
      type: getErrorTypeFromCode(code),
      code,
      message,
      userMessage: errorInfo.title,
      action: errorInfo.action ?? "",
      retryable: isRetryableError(code),
      severity: errorInfo.severity ?? "medium",
      timestamp: new Date().toISOString(),
    };

    if (originalError) {
      details.originalError = originalError;
    }

    this.details = details;
  }
}

function getErrorTypeFromCode(code: ErrorCode): ErrorType {
  // Timeout errors (check first to avoid being caught by network)
  if (code.includes("TIMEOUT")) {
    return ErrorType.TIMEOUT;
  }

  // Network errors
  if (
    code.startsWith("CONNECTION") ||
    code === "OFFLINE" ||
    code === "WEBSOCKET_DISCONNECTED" ||
    code === "SERVER_UNREACHABLE"
  ) {
    return ErrorType.NETWORK;
  }

  // Authentication/Authorization errors
  if (
    code.startsWith("UNAUTHORIZED") ||
    code.startsWith("NOT_IN") ||
    code.startsWith("MEETING_ACCESS") ||
    code.startsWith("FACILITATOR") ||
    code.startsWith("WATCHER") ||
    code === "INSUFFICIENT_PERMISSIONS" ||
    code === "INVALID_ROLE"
  ) {
    return ErrorType.AUTHENTICATION;
  }

  // Conflict errors
  if (
    code.startsWith("ALREADY") ||
    code.startsWith("DUPLICATE") ||
    code.startsWith("MEETING_CODE")
  ) {
    return ErrorType.CONFLICT;
  }

  const conflictCodes = new Set<ErrorCode>([
    ErrorCode.QUEUE_EMPTY,
    ErrorCode.PARTICIPANT_ALREADY_EXISTS,
    ErrorCode.MEETING_ENDED,
    ErrorCode.MEETING_FULL,
    ErrorCode.INVALID_OPERATION,
    ErrorCode.QUEUE_LIMIT_REACHED,
  ]);

  if (conflictCodes.has(code)) {
    return ErrorType.CONFLICT;
  }

  // Validation errors
  if (
    code.startsWith("INVALID") ||
    code === ErrorCode.MISSING_REQUIRED_FIELD ||
    code.startsWith("NAME_") ||
    code === ErrorCode.INVALID_CHARACTERS
  ) {
    return ErrorType.VALIDATION;
  }

  // Not found errors
  if (
    code.startsWith("NOT_FOUND") ||
    code === ErrorCode.MEETING_NOT_FOUND ||
    code === ErrorCode.PARTICIPANT_NOT_FOUND ||
    code === ErrorCode.QUEUE_ITEM_NOT_FOUND
  ) {
    return ErrorType.NOT_FOUND;
  }

  // Server errors
  if (
    code.startsWith("INTERNAL") ||
    code.startsWith("SERVICE") ||
    code === ErrorCode.DATABASE_ERROR ||
    code === ErrorCode.RATE_LIMIT_EXCEEDED
  ) {
    return ErrorType.SERVER;
  }

  // Business logic errors (mapped to appropriate types)
  return ErrorType.UNKNOWN;
}

function isRetryableError(code: ErrorCode): boolean {
  const retryableCodes: ErrorCode[] = [
    ErrorCode.CONNECTION_FAILED,
    ErrorCode.NETWORK_TIMEOUT,
    ErrorCode.OFFLINE,
    ErrorCode.WEBSOCKET_DISCONNECTED,
    ErrorCode.SERVER_UNREACHABLE,
    ErrorCode.INTERNAL_SERVER_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.JOIN_TIMEOUT,
    ErrorCode.SOCKET_TIMEOUT,
    ErrorCode.REQUEST_TIMEOUT,
    ErrorCode.RATE_LIMIT_EXCEEDED,
  ];
  return retryableCodes.includes(code);
}

// Error logging utility
export const logError = (error: AppError | Error, context?: string) => {
  const timestamp = new Date().toISOString();
  const errorInfo =
    error instanceof AppError
      ? error.details
      : {
          type: ErrorType.UNKNOWN,
          code: "UNKNOWN" as ErrorCode,
          message: error.message,
          userMessage: "An unexpected error occurred",
          retryable: false,
          timestamp,
          originalError: error,
        };

  const structuredError = {
    ...errorInfo,
    context,
    action: "log_error",
    stack: error.stack,
    error: error.message,
  };

  const contextLabel = context ? ` [${context}]` : "";
  const logMessage = `[${timestamp}]${contextLabel} Error: ${errorInfo.message}`;

  // eslint-disable-next-line no-console
  console.error(logMessage, structuredError);

  logProduction("error", {
    ...structuredError,
    timestamp,
  });

};

// Error boundary helper
export const getErrorDisplayInfo = (error: AppError | Error) => {
  if (error instanceof AppError) {
    return {
      title: error.details.userMessage,
      description: error.details.message,
      action: error.details.action,
      retryable: error.details.retryable,
      severity: error.details.severity,
    };
  }

  return {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    action: "Refresh the page or try again later.",
    retryable: true,
    severity: "medium" as const,
  };
};
