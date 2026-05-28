import { useState, useEffect } from 'react';
import type { TimerEntry, TimerStatus } from '../../types';
import { getTimerStatus, getCountdown, formatTimeAgo } from '../../utils/timer';

interface Props {
  entry: TimerEntry | undefined;
  respawnMin: number;
  respawnWindow: number;
}

const STATUS_STYLES: Record<TimerStatus, string> = {
  unknown: 'text-gray-500',
  dead:    'text-red-400',
  window:  'text-yellow-300 animate-pulse',
  alive:   'text-green-400',
};

export function MVPTimerBar({ entry, respawnMin, respawnWindow }: Props) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const status = getTimerStatus(entry, respawnMin, respawnWindow);
  const countdown = getCountdown(entry, respawnMin, respawnWindow);
  const earliest = respawnMin;
  const latest = respawnMin + respawnWindow;

  return (
    <div className="mt-2 space-y-0.5">
      <div className={`text-xl font-mono font-bold tracking-widest leading-none ${STATUS_STYLES[status]}`}>
        {countdown}
      </div>

      {entry && (
        <p className="text-xs text-ro-muted">
          {entry.killedBy} · {formatTimeAgo(entry.killedAt)}
          {(entry.tombX !== undefined) && (
            <span className="ml-1 text-yellow-600" title="Tomb placed on map">☠</span>
          )}
        </p>
      )}

      <p className="text-xs text-ro-muted">
        Respawn: <span className="text-gray-400">{earliest}~{latest} min</span>
      </p>
    </div>
  );
}
