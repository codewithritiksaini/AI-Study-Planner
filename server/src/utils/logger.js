/**
 * logger.js
 *
 * Production-ready structured JSON logger for AI Study Planner.
 * Features:
 * - Leveled logging (DEBUG, INFO, WARN, ERROR).
 * - Automatic sensitive field masking (tokens, passwords, API keys, bearer headers).
 * - Single-line structured JSON logs in production, clean readable output in development.
 */

import { env } from '../config/env.js';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const SENSITIVE_KEY_REGEX = /(password|token|secret|authorization|api[_-]?key|cookie|bearer|credential|service_role)/i;

/**
 * Recursively masks sensitive fields in objects, arrays, and strings.
 *
 * @param {*} data - Data object to sanitize
 * @returns {*} Sanitized data
 */
export function maskSensitiveData(data, depth = 0) {
  if (depth > 6 || data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Redact bearer tokens or API key lookalikes
    return data
      .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]')
      .replace(/key=[A-Za-z0-9\-_.]+/gi, 'key=[REDACTED]');
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, depth + 1));
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: maskSensitiveData(data.message, depth + 1),
      code: data.code,
      statusCode: data.statusCode,
      stack: env.NODE_ENV === 'production' ? undefined : data.stack
    };
  }

  if (typeof data === 'object') {
    const masked = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        masked[key] = '[REDACTED]';
      } else {
        masked[key] = maskSensitiveData(value, depth + 1);
      }
    }
    return masked;
  }

  return data;
}

class Logger {
  constructor() {
    const configuredLevel = (process.env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase();
    this.currentLevel = LOG_LEVELS[configuredLevel] !== undefined ? LOG_LEVELS[configuredLevel] : LOG_LEVELS.info;
  }

  setLevel(levelName) {
    const lvl = (levelName || '').toLowerCase();
    if (LOG_LEVELS[lvl] !== undefined) {
      this.currentLevel = LOG_LEVELS[lvl];
    }
  }

  _log(levelName, message, meta = {}) {
    const levelVal = LOG_LEVELS[levelName];
    if (levelVal < this.currentLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const safeMeta = maskSensitiveData(meta);

    if (env.NODE_ENV === 'production') {
      const entry = {
        timestamp,
        level: levelName.toUpperCase(),
        message: typeof message === 'string' ? maskSensitiveData(message) : message,
        ...(safeMeta && Object.keys(safeMeta).length > 0 ? { metadata: safeMeta } : {})
      };
      const stream = levelVal >= LOG_LEVELS.error ? process.stderr : process.stdout;
      stream.write(JSON.stringify(entry) + '\n');
    } else {
      const prefix = `[${timestamp}] [${levelName.toUpperCase()}]`;
      const stream = levelVal >= LOG_LEVELS.error ? console.error : levelVal === LOG_LEVELS.warn ? console.warn : console.log;
      if (safeMeta && Object.keys(safeMeta).length > 0) {
        stream(`${prefix} ${message}`, safeMeta);
      } else {
        stream(`${prefix} ${message}`);
      }
    }
  }

  debug(message, meta) {
    this._log('debug', message, meta);
  }

  info(message, meta) {
    this._log('info', message, meta);
  }

  warn(message, meta) {
    this._log('warn', message, meta);
  }

  error(message, meta) {
    this._log('error', message, meta);
  }
}

export const logger = new Logger();
