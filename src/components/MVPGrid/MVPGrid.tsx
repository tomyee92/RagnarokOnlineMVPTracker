import type { MVPEntry, TimersMap, PingsMap, FilterState } from '../../types';
import { getTimerStatus } from '../../utils/timer';
import { MVPCard } from '../MVPCard/MVPCard';

interface Props {
  mvps: MVPEntry[];
  timers: TimersMap;
  pings: PingsMap;
  filter: FilterState;
  onKill: (mvpId: number, locationIndex: number) => void;
  onReset: (mvpId: number, locationIndex: number) => void;
  onTombPlace: (mvpId: number, locationIndex: number, x: number, y: number) => void;
  onPing: (mvpId: number) => void;
  onClearPing: (mvpId: number) => void;
}

/** Active ping = within 30 minutes of being placed */
const PING_TTL_MS = 30 * 60 * 1000;
export function isPingActive(ping: { pingedAt: number } | undefined): boolean {
  if (!ping) return false;
  return Date.now() - ping.pingedAt < PING_TTL_MS;
}

/** Returns the most recent killedAt across all locations, or -1 if no timer set */
function getLatestKill(mvp: MVPEntry, timers: TimersMap): number {
  let latest = -1;
  mvp.locations.forEach((_, idx) => {
    const entry = timers[`${mvp.id}_${idx}`];
    if (entry && entry.killedAt > latest) latest = entry.killedAt;
  });
  return latest;
}

export function MVPGrid({ mvps, timers, pings, filter, onKill, onReset, onTombPlace, onPing, onClearPing }: Props) {
  const filtered = mvps.filter((mvp) => {
    if (filter.search && !mvp.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.element && mvp.element !== filter.element) return false;
    if (filter.race && mvp.race !== filter.race) return false;
    if (filter.status !== 'all') {
      const hasMatch = mvp.locations.some((loc, idx) => {
        const key = `${mvp.id}_${idx}`;
        const rMin = loc.respawnMin ?? mvp.respawnMin;
        const rWin = loc.respawnWindow ?? mvp.respawnWindow;
        return getTimerStatus(timers[key], rMin, rWin) === filter.status;
      });
      if (!hasMatch) return false;
    }
    return true;
  });

  // Sort: pinged MVPs first (by pingedAt desc), then tracked (by killedAt desc), then unknown (alpha)
  const sorted = [...filtered].sort((a, b) => {
    const aPinged = isPingActive(pings[String(a.id)]);
    const bPinged = isPingActive(pings[String(b.id)]);
    if (aPinged !== bPinged) return aPinged ? -1 : 1;
    if (aPinged && bPinged) {
      return pings[String(b.id)].pingedAt - pings[String(a.id)].pingedAt;
    }

    const aKill = getLatestKill(a, timers);
    const bKill = getLatestKill(b, timers);
    if (aKill === -1 && bKill === -1) return a.name.localeCompare(b.name);
    if (aKill === -1) return 1;
    if (bKill === -1) return -1;
    return bKill - aKill;
  });

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-ro-muted py-20">
        No MVPs match the current filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4 max-w-screen-2xl mx-auto w-full">
      {sorted.map((mvp) => (
        <MVPCard
          key={mvp.id}
          mvp={mvp}
          timers={timers}
          ping={pings[String(mvp.id)]}
          onKill={onKill}
          onReset={onReset}
          onTombPlace={onTombPlace}
          onPing={onPing}
          onClearPing={onClearPing}
        />
      ))}
    </div>
  );
}
