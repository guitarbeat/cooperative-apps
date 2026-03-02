// Production logging utility
// Provides structured logging for production environments

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
}

class ProductionLogger {
  private level: LogLevel = LogLevel.INFO;
  private isProduction = import.meta.env.PROD;
  private enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === "true";

  constructor() {
    // Set log level based on environment
    if (import.meta.env.DEV) {
      this.level = LogLevel.DEBUG;
    } else if (this.isProduction) {
      this.level = LogLevel.WARN; // Only warnings and errors in production
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (data && Object.keys(data).length > 0) {
      entry.data = data;
    }

    const userId = this.getUserId();
    if (userId) {
      entry.userId = userId;
    }

    const sessionId = this.getSessionId();
    if (sessionId) {
      entry.sessionId = sessionId;
    }

    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : undefined;
    if (userAgent) {
      entry.userAgent = userAgent;
    }

    return entry;
  }

  private getUserId(): string | undefined {
    // Get from Supabase auth or local storage
    try {
      const authData = localStorage.getItem("sb-auth-token");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.user?.id;
      }
    } catch {
      // Ignore parsing errors
    }
    return undefined;
  }

  private getSessionId(): string | undefined {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("session_id", sessionId);
    }
    return sessionId;
  }

  private log(entry: LogEntry): void {
    // Console logging (will be stripped in production builds)
    const levelName = LogLevel[entry.level];
    const logMethod =
      entry.level >= LogLevel.ERROR
        ? "error"
        : entry.level >= LogLevel.WARN
          ? "warn"
          : "log";

    if (!this.isProduction) {
      // eslint-disable-next-line no-console
      console[logMethod](`[${levelName}] ${entry.message}`, entry.data ?? "");
    }

    // Send to analytics/monitoring service in production
    if (
      this.enableAnalytics &&
      this.isProduction &&
      entry.level >= LogLevel.WARN
    ) {
      void this.sendToAnalytics(entry);
    }
  }

  private async sendToAnalytics(entry: LogEntry): Promise<void> {
    try {
      // Send to analytics service (e.g., Google Analytics, Sentry, etc.)
      // This is a placeholder - implement based on your analytics provider
      if (import.meta.env.VITE_SENTRY_DSN) {
        // Sentry integration
        // * Log analytics event for debugging in development
        if (import.meta.env.DEV) {
          logProduction('info', {
            action: 'analytics_event',
            entry
          });
        }
      }

      // Could also send to custom endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      // Don't log analytics errors to avoid infinite loops
      // * Log analytics error for debugging in development
      if (import.meta.env.DEV) {
        logProduction('error', {
          action: 'analytics_send_failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(this.formatMessage(LogLevel.INFO, message, data));
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(this.formatMessage(LogLevel.WARN, message, data));
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.ERROR)) {
      return;
    }

    const context = data && Object.keys(data).length > 0 ? { ...data } : undefined;
    this.log(this.formatMessage(LogLevel.ERROR, message, context));
  }

  // Performance monitoring
  performance(metric: string, value: number, data?: Record<string, unknown>): void {
    this.info(`Performance: ${metric}`, { value, ...data });
  }

  // User action tracking
  userAction(action: string, data?: Record<string, unknown>): void {
    this.info(`User Action: ${action}`, data);
  }

  // Error boundary logging
  errorBoundary(error: Error, errorInfo: Record<string, unknown>): void {
    this.error("Error Boundary Caught", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
    });
  }
}

// Export singleton instance
export const logger = new ProductionLogger();

// Convenience functions for common use cases
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);
export const logPerformance = logger.performance.bind(logger);
export const logUserAction = logger.userAction.bind(logger);

// Generic logging function that accepts level as string
type ProductionLogLevel = 'error' | 'warn' | 'info' | 'debug';

type ProductionLogData = Record<string, unknown> & {
  message?: string;
  error?: unknown;
  stack?: unknown;
};

export const logProduction = (
  level: string,
  data: ProductionLogData = {},
): void => {
  const normalizedLevel = level.toLowerCase() as ProductionLogLevel;
  const context: Record<string, unknown> = { ...data };

  if (data.error instanceof Error) {
    context.error = data.error.message;
    context.stack = data.error.stack ?? context.stack;
  }

  switch (normalizedLevel) {
    case 'error': {
      const message =
        typeof data.error === 'string'
          ? data.error
          : data.message ?? 'Production error';
      logger.error(message, context);
      break;
    }
    case 'warn': {
      const message = data.message ?? 'Production warning';
      logger.warn(message, context);
      break;
    }
    case 'info': {
      const message = data.message ?? 'Production info';
      logger.info(message, context);
      break;
    }
    case 'debug': {
      const message = data.message ?? 'Production debug';
      logger.debug(message, context);
      break;
    }
    default: {
      logger.info(`Production log [${level}]`, context);
    }
  }
};
