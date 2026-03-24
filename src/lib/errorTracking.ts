/**
 * Error tracking abstraction.
 * Currently logs to console + localStorage.
 * Drop-in ready for Sentry: replace the functions below.
 *
 * To enable Sentry:
 * 1. npm install @sentry/react
 * 2. Call Sentry.init({ dsn: '...' }) in main.tsx
 * 3. Replace captureException/captureMessage with Sentry equivalents
 */

interface ErrorEntry {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  url: string;
}

const ERROR_LOG_KEY = 'crusade_error_log';
const MAX_ERRORS = 100;

function loadErrorLog(): ErrorEntry[] {
  try {
    const stored = localStorage.getItem(ERROR_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveErrorLog(log: ErrorEntry[]): void {
  try {
    if (log.length > MAX_ERRORS) log = log.slice(-MAX_ERRORS);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(log));
  } catch { /* quota */ }
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  console.error('[CrusadeCommand Error]', error, context);
  const log = loadErrorLog();
  log.push({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  });
  saveErrorLog(log);
}

export function captureMessage(message: string, context?: Record<string, unknown>): void {
  console.warn('[CrusadeCommand]', message, context);
  const log = loadErrorLog();
  log.push({
    message,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  });
  saveErrorLog(log);
}

export function getErrorLog(): ErrorEntry[] {
  return loadErrorLog();
}

export function clearErrorLog(): void {
  localStorage.removeItem(ERROR_LOG_KEY);
}

// Global unhandled error handler
window.addEventListener('unhandledrejection', (event) => {
  captureException(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    { type: 'unhandled_promise_rejection' }
  );
});

window.addEventListener('error', (event) => {
  if (event.error) {
    captureException(event.error, { type: 'uncaught_error' });
  }
});
