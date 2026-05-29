import { useEffect, useState } from 'react';
import type { MVPEntry, MVPSpawnLocation, TimerEntry, TimersMap, TimerStatus, PingEntry } from '../../types';
import { getTimerStatus } from '../../utils/timer';
import { isPingActive } from '../MVPGrid/MVPGrid';
import { MVPTimerBar } from './MVPTimerBar';

interface Props {
  mvp: MVPEntry;
  timers: TimersMap;
  ping: PingEntry | undefined;
  onKill: (mvpId: number, locationIndex: number) => void;
  onReset: (mvpId: number, locationIndex: number) => void;
  onTombPlace: (mvpId: number, locationIndex: number, x: number, y: number) => void;
  onPing: (mvpId: number) => void;
  onClearPing: (mvpId: number) => void;
}

const CARD_BORDER: Record<TimerStatus, string> = {
  unknown: 'border-ro-border',
  dead:    'border-red-800',
  window:  'border-yellow-400',
  alive:   'border-green-700',
};

const CARD_BG: Record<TimerStatus, string> = {
  unknown: '',
  dead:    'bg-red-950/20',
  window:  'bg-yellow-950/30',
  alive:   'bg-green-950/20',
};

const ELEMENT_BADGE: Record<string, string> = {
  Fire:    'bg-red-900/60 text-red-300',
  Water:   'bg-blue-900/60 text-blue-300',
  Wind:    'bg-teal-900/60 text-teal-300',
  Earth:   'bg-yellow-900/60 text-yellow-600',
  Dark:    'bg-purple-900/60 text-purple-300',
  Holy:    'bg-yellow-800/60 text-yellow-200',
  Ghost:   'bg-gray-700/60 text-gray-300',
  Poison:  'bg-green-900/60 text-green-400',
  Neutral: 'bg-gray-800/60 text-gray-400',
  Undead:  'bg-indigo-900/60 text-indigo-300',
};

function elementStyle(el: string) {
  const base = el.split(' ')[0]; // handle "Dark 3" → "Dark"
  return ELEMENT_BADGE[base] ?? 'bg-gray-800/60 text-gray-300';
}

// Local bundled sprites first (.gif, then .png for newer monsters), then CDN fallbacks
const BASE = import.meta.env.BASE_URL;
const SPRITE_SOURCES = [
  (id: number) => `${BASE}assets/sprites/${id}.gif`,
  (id: number) => `${BASE}assets/sprites/${id}.png`,
  (id: number) => `https://www.ratemyserver.net/mobs/${id}.gif`,
  (id: number) => `https://db.irowiki.org/image/monster/${id}.png`,
];

// Local bundled maps only (irowiki removed — it returns a "Report Missing Map"
// placeholder image for EP19+ maps instead of a real 404, which browsers render).
// Classic maps are .jpg; newer maps downloaded from ratemyserver are .gif.
const MAP_SOURCES = [
  (mapCode: string) => `${BASE}assets/maps/${mapCode}.jpg`,
  (mapCode: string) => `${BASE}assets/maps/${mapCode}.gif`,
];

function MonsterPlaceholder({ name }: { name: string }) {
  return (
    <div className="w-16 h-16 flex items-center justify-center bg-ro-dark rounded text-center">
      <span className="text-ro-muted text-[9px] leading-tight px-1 break-words">{name.split(' ')[0]}</span>
    </div>
  );
}

// Inline expandable map with tomb placement
function InlineMap({
  location,
  timerEntry,
  onTombPlace,
}: {
  location: MVPSpawnLocation;
  timerEntry: TimerEntry | undefined;
  onTombPlace: (x: number, y: number) => void;
}) {
  const [mapSrcIndex, setMapSrcIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [placingTomb, setPlacingTomb] = useState(false);

  const mapSrc = MAP_SOURCES[mapSrcIndex]?.(location.map);

  useEffect(() => {
    setMapSrcIndex(0);
    setMapLoaded(false);
    setPlacingTomb(false);
  }, [location.map]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingTomb) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onTombPlace(x, y);
    setPlacingTomb(false);
  };

  return (
    <div className="mt-2 border border-ro-border/30 rounded overflow-hidden">
      <div
        className={`relative bg-ro-dark ${placingTomb ? 'cursor-crosshair ring-2 ring-inset ring-yellow-400' : ''}`}
        onClick={handleMapClick}
      >
        {mapSrc ? (
          <img
            key={mapSrc}
            src={mapSrc}
            alt={`Map: ${location.mapName}`}
            referrerPolicy="no-referrer"
            onLoad={() => setMapLoaded(true)}
            onError={() => {
              if (mapSrcIndex < MAP_SOURCES.length - 1) setMapSrcIndex(mapSrcIndex + 1);
              else setMapSrcIndex(MAP_SOURCES.length);
            }}
            className="w-full h-auto block max-h-52 object-contain"
          />
        ) : (
          <div className="w-full h-28 flex items-center justify-center text-ro-muted text-xs">
            Map unavailable: <span className="font-mono ml-1">{location.map}</span>
          </div>
        )}

        {/* Tomb marker */}
        {timerEntry?.tombX !== undefined && timerEntry.tombY !== undefined && mapLoaded && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: `${timerEntry.tombX * 100}%`,
              top: `${timerEntry.tombY * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative flex items-center justify-center">
              {/* Outer ping ring */}
              <div className="absolute w-8 h-8 rounded-full bg-fuchsia-500/50 animate-ping" />
              {/* Solid colored dot backing */}
              <div className="w-6 h-6 rounded-full bg-fuchsia-600 border-2 border-fuchsia-300 shadow-lg shadow-fuchsia-500/80 flex items-center justify-center relative z-10">
                <span className="text-white text-xs leading-none" title={`Killed by ${timerEntry?.killedBy}`}>☠</span>
              </div>
            </div>
          </div>
        )}

        {/* Placing hint overlay */}
        {placingTomb && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 text-yellow-300 text-xs px-2 py-1 rounded font-semibold">
              Click to place tomb
            </div>
          </div>
        )}
      </div>

      {/* Tomb controls */}
      <div className="flex gap-1.5 p-1.5 bg-ro-dark/60">
        <button
          onClick={() => setPlacingTomb(!placingTomb)}
          className={`text-xs px-2 py-0.5 rounded border transition-colors ${
            placingTomb
              ? 'bg-yellow-800/40 border-yellow-500 text-yellow-300'
              : 'bg-ro-input border-ro-border text-ro-muted hover:text-white'
          }`}
        >
          ☠ {placingTomb ? 'Cancel' : 'Place Tomb'}
        </button>
        {timerEntry?.tombX !== undefined && (
          <button
            onClick={() => onTombPlace(-1, -1)}
            className="text-xs px-2 py-0.5 rounded border border-ro-border bg-ro-input text-ro-muted hover:text-white transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export function MVPCard({ mvp, timers, ping, onKill, onReset, onTombPlace, onPing, onClearPing }: Props) {
  const [srcIndex, setSrcIndex] = useState(0);

  // Persist collapse state per MVP in localStorage.
  // Default = all expanded (empty collapsed set = first-time user sees maps open).
  const storageKey = `mvp_map_${mvp.id}`;
  const [collapsedLocs, setCollapsedLocs] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return new Set<number>(JSON.parse(saved) as number[]);
    } catch { /* ignore */ }
    return new Set<number>(); // all expanded by default
  });

  const toggleLoc = (idx: number) => {
    setCollapsedLocs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const imgSrc = SPRITE_SOURCES[srcIndex]?.(mvp.id);

  const handleImgError = () => {
    if (srcIndex < SPRITE_SOURCES.length - 1) setSrcIndex(srcIndex + 1);
    else setSrcIndex(SPRITE_SOURCES.length); // triggers placeholder
  };

  const overallStatus: TimerStatus = mvp.locations.reduce<TimerStatus>((worst, loc, idx) => {
    const key = `${mvp.id}_${idx}`;
    const rMin = loc.respawnMin ?? mvp.respawnMin;
    const rWin = loc.respawnWindow ?? mvp.respawnWindow;
    const s = getTimerStatus(timers[key], rMin, rWin);
    const order: TimerStatus[] = ['alive', 'window', 'dead', 'unknown'];
    return order.indexOf(s) < order.indexOf(worst) ? s : worst;
  }, 'unknown');

  const pinged = isPingActive(ping);

  return (
    <div className={`rounded-lg border ${pinged ? 'border-orange-400' : CARD_BORDER[overallStatus]} ${CARD_BG[overallStatus]} overflow-hidden flex flex-col bg-ro-card transition-colors duration-500`}>

      {/* Ping alert banner */}
      {pinged && (
        <div className="flex items-center justify-between gap-2 bg-orange-500/20 border-b border-orange-500/40 px-3 py-1.5">
          <span className="text-orange-300 text-xs font-bold animate-pulse">
            📢 Pinged by {ping!.pingedBy}
          </span>
          <button
            onClick={() => onClearPing(mvp.id)}
            className="text-orange-400 hover:text-white text-xs transition-colors"
            title="Dismiss ping"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start gap-3 p-3">
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-ro-dark rounded overflow-hidden">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={mvp.name}
              referrerPolicy="no-referrer"
              onError={handleImgError}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <MonsterPlaceholder name={mvp.name} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-white font-semibold text-sm leading-tight">{mvp.name}</h3>
            {/* Ping button */}
            <button
              onClick={() => pinged ? onClearPing(mvp.id) : onPing(mvp.id)}
              title={pinged ? 'Clear ping' : 'Ping guild — moves this card to top'}
              className={`flex-shrink-0 text-base leading-none transition-colors ${
                pinged ? 'text-orange-400 hover:text-orange-300' : 'text-ro-muted hover:text-orange-400'
              }`}
            >
              📢
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${elementStyle(mvp.element)}`}>{mvp.element}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-400">{mvp.race}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-400">Lv {mvp.level}</span>
          </div>
          <p className="text-ro-muted text-xs mt-1">{(mvp.hp / 1_000_000).toFixed(1)}M HP</p>
        </div>
      </div>

      {/* Per-location timers */}
      <div className="px-3 pb-3 flex-1 space-y-3">
        {mvp.locations.map((loc, idx) => {
          const key = `${mvp.id}_${idx}`;
          const entry = timers[key];
          const rMin = loc.respawnMin ?? mvp.respawnMin;
          const rWin = loc.respawnWindow ?? mvp.respawnWindow;
          const isExpanded = !collapsedLocs.has(idx); // default: expanded

          return (
            <div key={idx} className="border-t border-ro-border/40 pt-2 first:border-0 first:pt-0">
              {/* Map toggle button */}
              <button
                onClick={() => toggleLoc(idx)}
                className={`text-xs font-mono text-left transition-colors ${
                  isExpanded ? 'text-yellow-300' : 'text-ro-gold hover:text-white'
                }`}
                title={isExpanded ? 'Hide map' : 'Show map & place tomb'}
              >
                {isExpanded ? '🗺 ' : '📍 '}{loc.mapName}
              </button>

              <MVPTimerBar entry={entry} respawnMin={rMin} respawnWindow={rWin} />

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onKill(mvp.id, idx)}
                  className="flex-1 bg-red-900 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded transition-colors"
                >
                  ☠ KILL
                </button>
                {entry && (
                  <button
                    onClick={() => onReset(mvp.id, idx)}
                    className="px-3 bg-ro-input hover:bg-ro-border text-ro-muted hover:text-white text-xs py-1.5 rounded transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Inline map (expanded) */}
              {isExpanded && (
                <InlineMap
                  location={loc}
                  timerEntry={entry}
                  onTombPlace={(x, y) => onTombPlace(mvp.id, idx, x, y)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
