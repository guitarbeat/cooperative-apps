import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AppError,
  ErrorType,
  ErrorCode,
  ERROR_MESSAGES,
  getErrorDisplayInfo,
  logError,
} from "../errorHandling";

describe("AppError", () => {
  it("should create an error with correct details", () => {
    const error = new AppError(ErrorCode.CONNECTION_FAILED);

    expect(error.name).toBe("AppError");
    expect(error.message).toBe(ERROR_MESSAGES.CONNECTION_FAILED.description);
    expect(error.details.type).toBe(ErrorType.NETWORK);
    expect(error.details.code).toBe(ErrorCode.CONNECTION_FAILED);
    expect(error.details.userMessage).toBe(
      ERROR_MESSAGES.CONNECTION_FAILED.title,
    );
    expect(error.details.action).toBe(ERROR_MESSAGES.CONNECTION_FAILED.action);
    expect(error.details.retryable).toBe(true);
    expect(error.details.severity).toBe("high");
    expect(error.details.timestamp).toBeDefined();
  });

  it("should create an error with custom message", () => {
    const customMessage = "Custom error message";
    const error = new AppError(
      ErrorCode.CONNECTION_FAILED,
      undefined,
      customMessage,
    );

    expect(error.message).toBe(customMessage);
    expect(error.details.message).toBe(customMessage);
  });

  it("should include original error when provided", () => {
    const originalError = new Error("Original error");
    const error = new AppError(ErrorCode.CONNECTION_FAILED, originalError);

    expect(error.details.originalError).toBe(originalError);
  });

  it("should handle validation errors correctly", () => {
    const error = new AppError(ErrorCode.INVALID_MEETING_CODE);

    expect(error.details.type).toBe(ErrorType.VALIDATION);
    expect(error.details.retryable).toBe(false);
    expect(error.details.severity).toBe("low");
  });

  it("should handle authentication errors correctly", () => {
    const error = new AppError(ErrorCode.UNAUTHORIZED_FACILITATOR);

    expect(error.details.type).toBe(ErrorType.AUTHENTICATION);
    expect(error.details.retryable).toBe(false);
    expect(error.details.severity).toBe("medium");
  });

  it("should handle not found errors correctly", () => {
    const error = new AppError(ErrorCode.MEETING_NOT_FOUND);

    expect(error.details.type).toBe(ErrorType.NOT_FOUND);
    expect(error.details.retryable).toBe(false);
    expect(error.details.severity).toBe("medium");
  });

  it("should handle conflict errors correctly", () => {
    const error = new AppError(ErrorCode.ALREADY_IN_QUEUE);

    expect(error.details.type).toBe(ErrorType.CONFLICT);
    expect(error.details.retryable).toBe(false);
    expect(error.details.severity).toBe("low");
  });

  it("should handle server errors correctly", () => {
    const error = new AppError(ErrorCode.INTERNAL_SERVER_ERROR);

    expect(error.details.type).toBe(ErrorType.SERVER);
    expect(error.details.retryable).toBe(true);
    expect(error.details.severity).toBe("high");
  });

  it("should handle timeout errors correctly", () => {
    const error = new AppError(ErrorCode.NETWORK_TIMEOUT);

    expect(error.details.type).toBe(ErrorType.TIMEOUT);
    expect(error.details.retryable).toBe(true);
    expect(error.details.severity).toBe("medium");
  });
});

describe("getErrorDisplayInfo", () => {
  it("should return correct info for AppError", () => {
    const error = new AppError(ErrorCode.CONNECTION_FAILED);
    const info = getErrorDisplayInfo(error);

    expect(info.title).toBe(ERROR_MESSAGES.CONNECTION_FAILED.title);
    expect(info.description).toBe(ERROR_MESSAGES.CONNECTION_FAILED.description);
    expect(info.action).toBe(ERROR_MESSAGES.CONNECTION_FAILED.action);
    expect(info.retryable).toBe(true);
    expect(info.severity).toBe("high");
  });

  it("should return default info for regular Error", () => {
    const error = new Error("Regular error");
    const info = getErrorDisplayInfo(error);

    expect(info.title).toBe("Something went wrong");
    expect(info.description).toBe(
      "An unexpected error occurred. Please try again.",
    );
    expect(info.action).toBe("Refresh the page or try again later.");
    expect(info.retryable).toBe(true);
    expect(info.severity).toBe("medium");
  });
});

describe("logError", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  it("should log AppError correctly", () => {
    const error = new AppError(ErrorCode.CONNECTION_FAILED);
    const context = "test-context";

    logError(error, context);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] \[test-context\] Error:/),
      expect.objectContaining({
        type: ErrorType.NETWORK,
        code: ErrorCode.CONNECTION_FAILED,
        message: ERROR_MESSAGES.CONNECTION_FAILED.description,
        userMessage: ERROR_MESSAGES.CONNECTION_FAILED.title,
        retryable: true,
        severity: "high",
        timestamp: expect.any(String),
        stack: expect.any(String),
      }),
    );
  });

  it("should log regular Error correctly", () => {
    const error = new Error("Regular error");
    const context = "test-context";

    logError(error, context);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] \[test-context\] Error:/),
      expect.objectContaining({
        type: ErrorType.UNKNOWN,
        code: "UNKNOWN",
        message: "Regular error",
        userMessage: "An unexpected error occurred",
        retryable: false,
        timestamp: expect.any(String),
        originalError: error,
        stack: expect.any(String),
      }),
    );
  });

  it("should log without context", () => {
    const error = new AppError(ErrorCode.CONNECTION_FAILED);

    logError(error);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] Error:/),
      expect.any(Object),
    );
  });
});

describe("Error Messages", () => {
  it("should have all required error codes defined", () => {
    const errorCodes = Object.values(ErrorCode);
    const messageKeys = Object.keys(ERROR_MESSAGES);

    errorCodes.forEach((code) => {
      expect(messageKeys).toContain(code);
    });
  });

  it("should have consistent message structure", () => {
    Object.values(ERROR_MESSAGES).forEach((message) => {
      expect(message).toHaveProperty("title");
      expect(message).toHaveProperty("description");
      expect(typeof message.title).toBe("string");
      expect(typeof message.description).toBe("string");
      expect(message.title.length).toBeGreaterThan(0);
      expect(message.description.length).toBeGreaterThan(0);
    });
  });

  it("should have appropriate severity levels", () => {
    Object.entries(ERROR_MESSAGES).forEach(([_code, message]) => {
      if (message.severity) {
        expect(["low", "medium", "high"]).toContain(message.severity);
      }
    });
  });

  it("should have retryable errors marked correctly", () => {
    const retryableCodes = [
      "CONNECTION_FAILED",
      "NETWORK_TIMEOUT",
      "OFFLINE",
      "WEBSOCKET_DISCONNECTED",
      "SERVER_UNREACHABLE",
      "INTERNAL_SERVER_ERROR",
      "SERVICE_UNAVAILABLE",
      "DATABASE_ERROR",
      "JOIN_TIMEOUT",
      "SOCKET_TIMEOUT",
      "REQUEST_TIMEOUT",
      "RATE_LIMIT_EXCEEDED",
    ];

    retryableCodes.forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.details.retryable).toBe(true);
    });
  });

  it("should have non-retryable errors marked correctly", () => {
    const nonRetryableCodes = [
      "INVALID_MEETING_CODE",
      "INVALID_PARTICIPANT_NAME",
      "ALREADY_IN_QUEUE",
      "MEETING_NOT_FOUND",
      "UNAUTHORIZED_FACILITATOR",
    ];

    nonRetryableCodes.forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.details.retryable).toBe(false);
    });
  });
});

describe("Error Type Classification", () => {
  it("should classify network errors correctly", () => {
    const networkCodes = [
      "CONNECTION_FAILED",
      "OFFLINE",
      "WEBSOCKET_DISCONNECTED",
      "SERVER_UNREACHABLE",
    ];

    networkCodes.forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.details.type).toBe(ErrorType.NETWORK);
    });
  });

  it("should classify validation errors correctly", () => {
    const validationCodes = [
      "INVALID_MEETING_CODE",
      "INVALID_PARTICIPANT_NAME",
      "INVALID_QUEUE_TYPE",
      "MISSING_REQUIRED_FIELD",
      "INVALID_MEETING_TITLE",
      "NAME_TOO_LONG",
      "NAME_TOO_SHORT",
      "INVALID_CHARACTERS",
    ];

    validationCodes.forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.details.type).toBe(ErrorType.VALIDATION);
    });
  });

  it("should classify authentication errors correctly", () => {
    const authCodes = [
      "UNAUTHORIZED_FACILITATOR",
      "NOT_IN_MEETING",
      "MEETING_ACCESS_DENIED",
      "FACILITATOR_REQUIRED",
      "INSUFFICIENT_PERMISSIONS",
      "INVALID_ROLE",
      "WATCHER_CANNOT_JOIN_QUEUE",
      "WATCHER_CANNOT_LEAVE_QUEUE",
    ];

    authCodes.forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.details.type).toBe(ErrorType.AUTHENTICATION);
    });
  });

  it("should classify not found errors correctly", () => {
    const notFoundCodes = [
      "MEETING_NOT_FOUND",
      "PARTICIPANT_NOT_FOUND",
      "QUEUE_ITEM_NOT_FOUND",
    ];

    notFoundCodes.forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.details.type).toBe(ErrorType.NOT_FOUND);
    });
  });

  it("should classify conflict errors correctly", () => {
    const conflictCodes = [
      "ALREADY_IN_QUEUE",
      "DUPLICATE_PARTICIPANT",
      "MEETING_CODE_EXISTS",
      "QUEUE_EMPTY",
      "PARTICIPANT_ALREADY_EXISTS",
      "MEETING_ENDED",
      "MEETING_FULL",
      "INVALID_OPERATION",
      "QUEUE_LIMIT_REACHED",
    ];

    conflictCodes.forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.details.type).toBe(ErrorType.CONFLICT);
    });
  });

  it("should classify server errors correctly", () => {
    const serverCodes = [
      "INTERNAL_SERVER_ERROR",
      "SERVICE_UNAVAILABLE",
      "DATABASE_ERROR",
      "RATE_LIMIT_EXCEEDED",
    ];

    serverCodes.forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.details.type).toBe(ErrorType.SERVER);
    });
  });

  it("should classify timeout errors correctly", () => {
    const timeoutCodes = [
      "NETWORK_TIMEOUT",
      "JOIN_TIMEOUT",
      "SOCKET_TIMEOUT",
      "REQUEST_TIMEOUT",
    ];

    timeoutCodes.forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.details.type).toBe(ErrorType.TIMEOUT);
    });
  });
});
