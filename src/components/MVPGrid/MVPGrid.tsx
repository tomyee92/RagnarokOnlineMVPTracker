import type { MVPEntry, TimersMap, FilterState } from '../../types';
import { getTimerStatus } from '../../utils/timer';
import { MVPCard } from '../MVPCard/MVPCard';

interface Props {
  mvps: MVPEntry[];
  timers: TimersMap;
  filter: FilterState;
  onKill: (mvpId: number, locationIndex: number) => void;
  onReset: (mvpId: number, locationIndex: number) => void;
  onMapClick: (mvp: MVPEntry, locationIndex: number) => void;
}

export function MVPGrid({ mvps, timers, filter, onKill, onReset, onMapClick }: Props) {
  const filtered = mvps.filter((mvp) => {
    if (filter.search && !mvp.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.element && mvp.element !== filter.element) return false;
    if (filter.race && mvp.race !== filter.race) return false;
    if (filter.status !== 'all') {
      const hasMatch = mvp.locations.some((_, idx) => {
        const key = `${mvp.id}_${idx}`;
        return getTimerStatus(timers[key], mvp.respawnMin, mvp.respawnWindow) === filter.status;
      });
      if (!hasMatch) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-ro-muted py-20">
        No MVPs match the current filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4 max-w-screen-2xl mx-auto w-full">
      {filtered.map((mvp) => (
        <MVPCard
          key={mvp.id}
          mvp={mvp}
          timers={timers}
          onKill={onKill}
          onReset={onReset}
          onMapClick={onMapClick}
        />
      ))}
    </div>
  );
}
