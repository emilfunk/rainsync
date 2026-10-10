type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LOG_PREFIX = '[RainSync]';

/**
 * chrome://extensions shows logged objects as "[object Object]",
 * so warnings and errors carry their data as JSON text
 */
function toText(data: unknown): unknown {
  if (data === null || typeof data !== 'object') return data;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

function log(level: LogLevel, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `${LOG_PREFIX} [${timestamp}]`;

  switch (level) {
    case 'info':
      console.log(prefix, message, data !== undefined ? data : '');
      break;
    case 'warn':
      console.warn(prefix, message, data !== undefined ? toText(data) : '');
      break;
    case 'error':
      console.error(prefix, message, data !== undefined ? toText(data) : '');
      break;
    case 'debug':
      if (import.meta.env.DEV) {
        console.debug(prefix, message, data !== undefined ? data : '');
      }
      break;
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log('info', message, data),
  warn: (message: string, data?: unknown) => log('warn', message, data),
  error: (message: string, error?: unknown, data?: Record<string, unknown>) => {
    if (error instanceof Error) {
      log('error', message, {
        error: error.message,
        stack: error.stack,
        ...data,
      });
    } else {
      log('error', message, { error, ...data });
    }
  },
  debug: (message: string, data?: unknown) => log('debug', message, data),
};
