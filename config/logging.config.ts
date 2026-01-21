/**
 * Logging Configuration
 * Centralized logging and observability settings
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  includeTimestamp: boolean;
  includeContext: boolean;
  maxLogLength: number;
  sensitiveFields: string[];
}

export const loggingConfig: LoggingConfig = {
  level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
  enableConsole: true,
  enableRemote: import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true',
  remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
  includeTimestamp: true,
  includeContext: true,
  maxLogLength: 10000,
  sensitiveFields: ['apiKey', 'password', 'token', 'secret', 'authorization'],
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[loggingConfig.level];
}

function sanitizeData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (loggingConfig.sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const parts: string[] = [];

  if (loggingConfig.includeTimestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }

  parts.push(`[${level.toUpperCase()}]`);
  parts.push(message);

  if (loggingConfig.includeContext && context) {
    const sanitizedContext = sanitizeData(context);
    parts.push(JSON.stringify(sanitizedContext));
  }

  return parts.join(' ').slice(0, loggingConfig.maxLogLength);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, context));
    }
  },

  info: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, context));
    }
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, { ...context, error: error?.message, stack: error?.stack }));
    }
  },

  performance: (label: string, startTime: number) => {
    const duration = Date.now() - startTime;
    logger.info(`Performance: ${label}`, { durationMs: duration });
  },
};
