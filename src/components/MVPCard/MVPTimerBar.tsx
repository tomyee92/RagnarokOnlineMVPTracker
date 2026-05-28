import { useState, useEffect } from 'react';
import type { TimerEntry, TimerStatus } from '../../types';
import { getTimerStatus, getCountdown, formatTimeAgo } from '../../utils/timer';

interface Props {
  entry: TimerEntry | undefined;
  respawnMin: number;
  respawnWindow: number;
}

const STATUS_STYLES: Record<TimerStatus, string> = {
  unknown: 'text-gray-400',
  dead: 'text-red-400',
  window: 'text-yellow-300 animate-pulse',
  alive: 'text-green-400',
};

export function MVPTimerBar({ entry, respawnMin, respawnWindow }: Props) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = getTimerStatus(entry, respawnMin, respawnWindow);
  const countdown = getCountdown(entry, respawnMin, respawnWindow);

  return (
    <div className="mt-2">
      <div className={`text-xl font-mono font-bold tracking-widest ${STATUS_STYLES[status]}`}>
        {countdown}
      </div>
      {entry && (
        <div className="text-xs text-ro-muted mt-0.5">
          Killed by {entry.killedBy} · {formatTimeAgo(entry.killedAt)}
        </div>
      )}
      <div className="text-xs text-ro-muted mt-0.5">
        Respawn: {respawnMin}min (+{respawnWindow}min window)
      </div>
    </div>
  );
}
