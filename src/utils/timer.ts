import type { TimerEntry, TimerStatus } from '../types';

export function getTimerStatus(entry: TimerEntry | undefined, respawnMin: number, respawnWindow: number): TimerStatus {
  if (!entry) return 'unknown';
  const now = Date.now();
  const elapsed = now - entry.killedAt;
  const respawnMs = respawnMin * 60 * 1000;
  const windowMs = respawnWindow * 60 * 1000;
  if (elapsed < respawnMs) return 'dead';
  if (elapsed < respawnMs + windowMs) return 'window';
  return 'alive';
}

export function getCountdown(entry: TimerEntry | undefined, respawnMin: number, respawnWindow: number): string {
  if (!entry) return '--:--:--';
  const now = Date.now();
  const elapsed = now - entry.killedAt;
  const respawnMs = respawnMin * 60 * 1000;
  const windowMs = respawnWindow * 60 * 1000;
  let remaining: number;
  if (elapsed < respawnMs) {
    remaining = respawnMs - elapsed;
  } else if (elapsed < respawnMs + windowMs) {
    remaining = respawnMs + windowMs - elapsed;
  } else {
    return 'ALIVE';
  }
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getStatusLabel(status: TimerStatus): string {
  switch (status) {
    case 'dead': return 'DEAD';
    case 'window': return 'WINDOW';
    case 'alive': return 'ALIVE';
    default: return 'UNKNOWN';
  }
}

export function formatKilledBy(entry: TimerEntry | undefined): string {
  if (!entry) return '';
  return `by ${entry.killedBy}`;
}

export function formatTimeAgo(killedAt: number): string {
  const diffMs = Date.now() - killedAt;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h}h ${m}m ago`;
}
