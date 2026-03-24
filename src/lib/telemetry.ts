/**
 * Lightweight telemetry for tracking feature usage.
 * Data stays local (localStorage) — no external service required.
 * Can be extended to send to Supabase or analytics service.
 */

interface TelemetryEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

interface TelemetryStats {
  events: TelemetryEvent[];
  sessionCount: number;
  firstSeen: string;
  lastSeen: string;
  featureUsage: Record<string, number>;
}

const TELEMETRY_KEY = 'crusade_telemetry';
const MAX_EVENTS = 500;

function loadStats(): TelemetryStats {
  try {
    const stored = localStorage.getItem(TELEMETRY_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* empty */ }
  return {
    events: [],
    sessionCount: 0,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    featureUsage: {},
  };
}

function saveStats(stats: TelemetryStats): void {
  try {
    // Trim old events to prevent localStorage bloat
    if (stats.events.length > MAX_EVENTS) {
      stats.events = stats.events.slice(-MAX_EVENTS);
    }
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(stats));
  } catch { /* quota exceeded */ }
}

export function trackEvent(event: string, properties?: Record<string, string | number | boolean>): void {
  const stats = loadStats();
  stats.events.push({
    event,
    properties,
    timestamp: new Date().toISOString(),
  });
  stats.lastSeen = new Date().toISOString();
  stats.featureUsage[event] = (stats.featureUsage[event] || 0) + 1;
  saveStats(stats);
}

export function trackSession(): void {
  const stats = loadStats();
  stats.sessionCount++;
  stats.lastSeen = new Date().toISOString();
  saveStats(stats);
}

export function trackPageView(page: string): void {
  trackEvent('page_view', { page });
}

export function getUsageStats(): TelemetryStats {
  return loadStats();
}

export function clearTelemetry(): void {
  localStorage.removeItem(TELEMETRY_KEY);
}
