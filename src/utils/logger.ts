/**
 * Logging utilities for production-safe logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isProduction = import.meta.env.PROD;

const log = (level: LogLevel, message: string, data?: unknown): void => {
  if (isProduction && level === 'debug') {
    return; // Don't log debug messages in production
  }

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (data) {
    console[level === 'debug' ? 'log' : level](logMessage, data);
  } else {
    console[level === 'debug' ? 'log' : level](logMessage);
  }
};

export const logger = {
  info: (message: string, data?: unknown) => log('info', message, data),
  warn: (message: string, data?: unknown) => log('warn', message, data),
  error: (message: string, data?: unknown) => log('error', message, data),
  debug: (message: string, data?: unknown) => log('debug', message, data),
};
