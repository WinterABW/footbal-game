import { Injectable } from '@angular/core';

/**
 * Extended environment type for production with additional monitoring config
 */
interface ExtendedEnvironment {
  production: boolean;
  apiBaseUrl: string;
  apiTimeout: number;
  // SECURITY: Removed tapSecretKey - server validates via session
  cryptoDepositAddress?: string;

  analyticsKey?: string;
  enableLogging?: boolean;
}

/**
 * Log levels ordered by severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Structured log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Sensitive field patterns that should be redacted from logs
 */
const SENSITIVE_PATTERNS = [
  /^(token|accessToken|refreshToken|authToken|jwt)$/i,
  /^(password|secret|key|apiKey|apiSecret|privateKey)$/i,
  /^(authorization|bearer|credential)$/i,
];

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private readonly minLevel: LogLevel;

  constructor() {
    const env = environment as ExtendedEnvironment;
    this.minLevel = env.enableLogging ? LogLevel.DEBUG : LogLevel.INFO;
  }



  /**
   * Redact sensitive values from an object to prevent credential leakage
   */
  private redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));

      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        redacted[key] = this.redactSensitiveData(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = this.redactSensitiveData(context);
    }

    return entry;
  }

  /**
   * Format log entry for console output
   */
  private formatForConsole(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      entry.message,
    ];

    if (entry.context) {
      parts.push(JSON.stringify(entry.context));
    }

    return parts.join(' ');
  }

  /**
   * Check if a log level should be processed
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    console.debug(this.formatForConsole(entry));
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    console.info(this.formatForConsole(entry));
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    console.warn(this.formatForConsole(entry));


  }

  /**
   * Log an error message
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorContext: Record<string, unknown> = {
      ...context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };

    const entry = this.createLogEntry(LogLevel.ERROR, message, errorContext);
    console.error(this.formatForConsole(entry));


  }

  /**
   * Capture message to Sentry if available
   */



}

// Import environment for use in the service
import { environment } from '../../environments/environment';