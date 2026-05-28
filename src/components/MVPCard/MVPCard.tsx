import { useState } from 'react';
import type { MVPEntry, TimersMap, TimerStatus } from '../../types';
import { getTimerStatus } from '../../utils/timer';
import { MVPTimerBar } from './MVPTimerBar';

interface Props {
  mvp: MVPEntry;
  timers: TimersMap;
  playerName: string;
  onKill: (mvpId: number, locationIndex: number) => void;
  onReset: (mvpId: number, locationIndex: number) => void;
  onMapClick: (mvp: MVPEntry, locationIndex: number) => void;
}

const CARD_BORDER: Record<TimerStatus, string> = {
  unknown: 'border-ro-border',
  dead: 'border-red-700',
  window: 'border-yellow-400',
  alive: 'border-green-600',
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'bg-red-900/50 text-red-300',
  Water: 'bg-blue-900/50 text-blue-300',
  Wind: 'bg-teal-900/50 text-teal-300',
  Earth: 'bg-yellow-900/50 text-yellow-600',
  Dark: 'bg-purple-900/50 text-purple-300',
  Holy: 'bg-yellow-800/50 text-yellow-200',
  Ghost: 'bg-gray-700/50 text-gray-300',
  Poison: 'bg-green-900/50 text-green-400',
  Neutral: 'bg-gray-800/50 text-gray-400',
  Undead: 'bg-indigo-900/50 text-indigo-300',
};

function elementStyle(el: string) {
  return ELEMENT_COLORS[el] ?? 'bg-gray-800/50 text-gray-300';
}

const SPRITE_BASE = 'https://static.divine-pride.net/images/mobs/gif';
const SPRITE_PNG_BASE = 'https://static.divine-pride.net/images/mobs/png';

export function MVPCard({ mvp, timers, onKill, onReset, onMapClick }: Props) {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState(`${SPRITE_BASE}/${mvp.id}.gif`);

  const handleImgError = () => {
    if (!imgError) {
      setImgSrc(`${SPRITE_PNG_BASE}/${mvp.id}.png`);
      setImgError(true);
    }
  };

  // Determine worst-case status across all locations
  const overallStatus: TimerStatus = mvp.locations.reduce<TimerStatus>((worst, _, idx) => {
    const key = `${mvp.id}_${idx}`;
    const s = getTimerStatus(timers[key], mvp.respawnMin, mvp.respawnWindow);
    const order: TimerStatus[] = ['alive', 'window', 'dead', 'unknown'];
    return order.indexOf(s) < order.indexOf(worst) ? s : worst;
  }, 'unknown');

  return (
    <div
      className={`bg-ro-card rounded-lg border ${CARD_BORDER[overallStatus]} overflow-hidden flex flex-col transition-colors duration-500`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-3">
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-ro-dark rounded overflow-hidden">
          <img
            src={imgSrc}
            alt={mvp.name}
            onError={handleImgError}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{mvp.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${elementStyle(mvp.element)}`}>
              {mvp.element}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-400">
              {mvp.race}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-400">
              Lv {mvp.level}
            </span>
          </div>
          <p className="text-ro-muted text-xs mt-1">{(mvp.hp / 1_000_000).toFixed(1)}M HP</p>
        </div>
      </div>

      {/* Locations + Timers */}
      <div className="px-3 pb-2 flex-1 space-y-3">
        {mvp.locations.map((loc, idx) => {
          const key = `${mvp.id}_${idx}`;
          const entry = timers[key];
          const status = getTimerStatus(entry, mvp.respawnMin, mvp.respawnWindow);

          return (
            <div key={idx} className="border-t border-ro-border/50 pt-2 first:border-0 first:pt-0">
              <button
                onClick={() => onMapClick(mvp, idx)}
                className="text-xs text-ro-gold hover:text-white transition-colors font-mono"
                title="View spawn map"
              >
                {loc.mapName}
              </button>

              <MVPTimerBar
                entry={entry}
                respawnMin={mvp.respawnMin}
                respawnWindow={mvp.respawnWindow}
              />

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onKill(mvp.id, idx)}
                  className="flex-1 bg-red-900 hover:bg-red-700 text-white text-xs font-bold py-1 rounded transition-colors"
                >
                  KILL
                </button>
                {status !== 'unknown' && (
                  <button
                    onClick={() => onReset(mvp.id, idx)}
                    className="px-3 bg-ro-input hover:bg-ro-border text-ro-muted hover:text-white text-xs py-1 rounded transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MVP Drops */}
      {mvp.mvpDrops.length > 0 && (
        <div className="px-3 pb-3 border-t border-ro-border/50 pt-2">
          <p className="text-ro-muted text-xs mb-1 font-semibold tracking-wide">MVP DROPS</p>
          <div className="space-y-0.5">
            {mvp.mvpDrops.slice(0, 3).map((drop) => (
              <div key={drop.itemId} className="flex justify-between text-xs">
                <span className="text-gray-300 truncate mr-2">{drop.itemName}</span>
                <span className="text-ro-muted flex-shrink-0">{drop.chance}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
