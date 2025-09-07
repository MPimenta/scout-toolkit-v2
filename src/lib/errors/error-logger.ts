// Centralized Logging System
// Replaces console.log with structured logging

/**
 * Log levels for structured logging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Structure for log entries
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

/**
 * Centralized logger class for structured logging
 */
class Logger {
  private get isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }
  
  private get isTest() {
    return process.env.NODE_ENV === 'test';
  }

  /**
   * Formats log messages with timestamp, context, and error information
   * @param level - The log level
   * @param message - The log message
   * @param context - Optional context information
   * @param error - Optional error object
   * @returns Formatted log message string
   */
  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` | Error: ${error.message}${error.stack ? `\n${error.stack}` : ''}` : '';
    
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`;
  }

  /**
   * Determines if a log message should be output based on environment and level
   * @param level - The log level to check
   * @returns true if the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    // In test environment, only log errors
    if (this.isTest) {
      return level === LogLevel.ERROR;
    }
    
    // In development, log everything
    if (this.isDevelopment) {
      return true;
    }
    
    // In production, log warnings and errors only
    return level === LogLevel.WARN || level === LogLevel.ERROR;
  }

  /**
   * Internal logging method that handles formatting and output
   * @param level - The log level
   * @param message - The log message
   * @param context - Optional context information
   * @param error - Optional error object
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context, error);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * Logs a debug message
   * @param message - The debug message
   * @param context - Optional context information
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs an info message
   * @param message - The info message
   * @param context - Optional context information
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message
   * @param message - The warning message
   * @param context - Optional context information
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message with optional error object
   * @param message - The error message
   * @param error - Optional Error object
   * @param context - Optional context information
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

/**
 * Singleton logger instance for application-wide use
 */
export const logger = new Logger();

/**
 * Convenience functions for common logging patterns
 */
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) => logger.error(message, error, context),
};

/**
 * API-specific logging helpers for request/response logging
 */
export const apiLogger = {
  request: (method: string, url: string, context?: Record<string, unknown>) => {
    logger.info(`API Request: ${method} ${url}`, context);
  },
  
  response: (method: string, url: string, status: number, context?: Record<string, unknown>) => {
    const message = `API Response: ${method} ${url} - ${status}`;
    if (status >= 400) {
      logger.error(message, undefined, context);
    } else {
      logger.info(message, context);
    }
  },
  
  error: (method: string, url: string, error: Error, context?: Record<string, unknown>) => {
    logger.error(`API Error: ${method} ${url}`, error, context);
  },
};

// Database-specific logging helpers
export const dbLogger = {
  query: (query: string, context?: Record<string, unknown>) => {
    logger.debug(`DB Query: ${query}`, context);
  },
  
  error: (operation: string, error: Error, context?: Record<string, unknown>) => {
    logger.error(`DB Error: ${operation}`, error, context);
  },
};
