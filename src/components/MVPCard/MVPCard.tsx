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
  onKillAt: (mvpId: number, locationIndex: number, killedAt: number, killedBy: string) => void;
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
  const base = el.split(' ')[0];
  return ELEMENT_BADGE[base] ?? 'bg-gray-800/60 text-gray-300';
}

const BASE = import.meta.env.BASE_URL;

const SPRITE_SOURCES = [
  (id: number) => `${BASE}assets/sprites/${id}.gif`,
  (id: number) => `${BASE}assets/sprites/${id}.png`,
  (id: number) => `https://www.ratemyserver.net/mobs/${id}.gif`,
  (id: number) => `https://db.irowiki.org/image/monster/${id}.png`,
];

// Classic maps are .jpg; EP19/20 maps downloaded from ratemyserver are .gif.
// irowiki CDN removed — it returns a 300×300 "Report Missing Map" placeholder
// that browsers render despite HTTP 404 status.
const MAP_SOURCES = [
  (mapCode: string) => `${BASE}assets/maps/${mapCode}.jpg`,
  (mapCode: string) => `${BASE}assets/maps/${mapCode}.gif`,
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function MonsterPlaceholder({ name }: { name: string }) {
  return (
    <div className="w-16 h-16 flex items-center justify-center bg-ro-dark rounded text-center">
      <span className="text-ro-muted text-[9px] leading-tight px-1 break-words">{name.split(' ')[0]}</span>
    </div>
  );
}

/** Parse a HH:MM string into a ms timestamp for today (or yesterday if the time is in the future). */
function parseDeathTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return Date.now();
  const now = new Date();
  let ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0).getTime();
  if (ts > Date.now() + 60_000) ts -= 86_400_000; // future → assume yesterday
  return ts;
}

// ── Tomb marker (shared between inline map and zoomed overlay) ────────────────

function TombMarker({ killedBy }: { killedBy?: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-8 h-8 rounded-full bg-fuchsia-500/50 animate-ping" />
      <div
        className="w-6 h-6 rounded-full bg-fuchsia-600 border-2 border-fuchsia-300 shadow-lg shadow-fuchsia-500/80 flex items-center justify-center relative z-10"
        title={killedBy ? `Killed by ${killedBy}` : undefined}
      >
        <span className="text-white text-xs leading-none">☠</span>
      </div>
    </div>
  );
}

// ── Zoomed tomb placement overlay ────────────────────────────────────────────

function ZoomedTombPlacer({
  mvpName,
  location,
  onPlace,
  onSkip,
}: {
  mvpName: string;
  location: MVPSpawnLocation;
  onPlace: (x: number, y: number) => void;
  onSkip: () => void;
}) {
  const [srcIndex, setSrcIndex] = useState(0);
  const mapSrc = MAP_SOURCES[srcIndex]?.(location.map);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSkip]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onPlace(
      (e.clientX - rect.left) / rect.width,
      (e.clientY - rect.top)  / rect.height,
    );
  };

  return (
    // backdrop — click outside = skip
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onSkip}
    >
      <div
        className="bg-ro-card border border-ro-gold/50 rounded-lg w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-ro-border">
          <div>
            <p className="text-ro-gold font-bold text-sm">{mvpName}</p>
            <p className="text-ro-muted text-xs font-mono">{location.mapName}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-300 text-xs font-semibold animate-pulse">
              ☠ Click on the map where it died
            </span>
            <button
              onClick={onSkip}
              className="text-ro-muted hover:text-white text-sm border border-ro-border/60 hover:border-white/40 px-3 py-1 rounded transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Map — full width, crosshair cursor */}
        <div className="relative cursor-crosshair bg-ro-dark" onClick={handleClick}>
          {mapSrc ? (
            <img
              key={mapSrc}
              src={mapSrc}
              alt={`Map: ${location.mapName}`}
              referrerPolicy="no-referrer"
              onError={() => {
                if (srcIndex < MAP_SOURCES.length - 1) setSrcIndex(srcIndex + 1);
                else setSrcIndex(MAP_SOURCES.length);
              }}
              className="w-full h-auto block max-h-[70vh] object-contain"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center text-ro-muted text-sm">
              Map unavailable: <span className="font-mono ml-1">{location.map}</span>
            </div>
          )}

          {/* Hint overlay */}
          <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
            <div className="bg-black/70 text-yellow-300 text-xs px-4 py-1.5 rounded-full font-semibold border border-yellow-500/30">
              Click to mark death location — ESC or Skip to dismiss
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline map (view-only — placement happens via kill buttons) ───────────────

function InlineMap({
  location,
  timerEntry,
  onRemoveTomb,
}: {
  location: MVPSpawnLocation;
  timerEntry: TimerEntry | undefined;
  onRemoveTomb: () => void;
}) {
  const [mapSrcIndex, setMapSrcIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapSrc = MAP_SOURCES[mapSrcIndex]?.(location.map);

  useEffect(() => {
    setMapSrcIndex(0);
    setMapLoaded(false);
  }, [location.map]);

  const hasTomb = timerEntry?.tombX !== undefined && timerEntry.tombY !== undefined;

  return (
    <div className="mt-2 border border-ro-border/30 rounded overflow-hidden">
      <div className="relative bg-ro-dark">
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
        {hasTomb && mapLoaded && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: `${timerEntry!.tombX! * 100}%`,
              top:  `${timerEntry!.tombY! * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <TombMarker killedBy={timerEntry?.killedBy} />
          </div>
        )}
      </div>

      {/* Remove tomb */}
      {hasTomb && (
        <div className="px-1.5 py-1 bg-ro-dark/60">
          <button
            onClick={onRemoveTomb}
            className="text-xs px-2 py-0.5 rounded border border-ro-border bg-ro-input text-ro-muted hover:text-white transition-colors"
          >
            Remove Tomb
          </button>
        </div>
      )}
    </div>
  );
}

// ── Kill by Other form ────────────────────────────────────────────────────────

function KillByOtherForm({
  onConfirm,
  onCancel,
}: {
  onConfirm: (killedAt: number, killedBy: string) => void;
  onCancel: () => void;
}) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const [timeInput, setTimeInput] = useState(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  const [nameInput, setNameInput] = useState('');

  const handleConfirm = () => {
    onConfirm(parseDeathTime(timeInput), nameInput.trim() || 'Other');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="mt-2 bg-ro-dark/80 border border-orange-900/60 rounded p-2.5 space-y-2" onKeyDown={handleKey}>
      <p className="text-xs text-orange-300 font-semibold">Record kill by another player</p>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-ro-muted block mb-0.5">Death time (HH:MM)</label>
          <input
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className="w-full bg-ro-input border border-ro-border rounded px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-ro-gold"
            autoFocus
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-ro-muted block mb-0.5">Killed by</label>
          <input
            type="text"
            placeholder="Player name (optional)"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full bg-ro-input border border-ro-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-ro-gold"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          className="flex-1 bg-orange-900 hover:bg-orange-700 text-white text-xs font-bold py-1.5 rounded transition-colors"
        >
          ✓ Confirm
        </button>
        <button
          onClick={onCancel}
          className="px-3 bg-ro-input hover:bg-ro-border text-ro-muted hover:text-white text-xs py-1.5 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── MVPCard ───────────────────────────────────────────────────────────────────

export function MVPCard({ mvp, timers, ping, onKill, onKillAt, onReset, onTombPlace, onPing, onClearPing }: Props) {
  const [srcIndex, setSrcIndex] = useState(0);
  const [pendingTombLocIdx, setPendingTombLocIdx] = useState<number | null>(null);
  const [killByOtherLocIdx, setKillByOtherLocIdx] = useState<number | null>(null);

  // Persist per-MVP map collapse state in localStorage; default = all expanded.
  const storageKey = `mvp_map_${mvp.id}`;
  const [collapsedLocs, setCollapsedLocs] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return new Set<number>(JSON.parse(saved) as number[]);
    } catch { /* ignore */ }
    return new Set<number>();
  });

  const toggleLoc = (idx: number) => {
    setCollapsedLocs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const expandLoc = (idx: number) => {
    setCollapsedLocs((prev) => {
      if (!prev.has(idx)) return prev;
      const next = new Set(prev);
      next.delete(idx);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  /** Kill by Me: record kill then open zoomed tomb placer */
  const handleKilledByMe = (idx: number) => {
    onKill(mvp.id, idx);
    expandLoc(idx);
    setPendingTombLocIdx(idx);
    setKillByOtherLocIdx(null);
  };

  /** Kill by Other: confirm form → record kill → open zoomed tomb placer */
  const handleKillByOtherConfirm = (idx: number, killedAt: number, killedBy: string) => {
    onKillAt(mvp.id, idx, killedAt, killedBy);
    expandLoc(idx);
    setKillByOtherLocIdx(null);
    setPendingTombLocIdx(idx);
  };

  const imgSrc = SPRITE_SOURCES[srcIndex]?.(mvp.id);

  const overallStatus: TimerStatus = mvp.locations.reduce<TimerStatus>((worst, loc, idx) => {
    const key = `${mvp.id}_${idx}`;
    const s = getTimerStatus(timers[key], loc.respawnMin ?? mvp.respawnMin, loc.respawnWindow ?? mvp.respawnWindow);
    const order: TimerStatus[] = ['alive', 'window', 'dead', 'unknown'];
    return order.indexOf(s) < order.indexOf(worst) ? s : worst;
  }, 'unknown');

  const pinged = isPingActive(ping);

  return (
    <>
      <div className={`rounded-lg border ${pinged ? 'border-orange-400' : CARD_BORDER[overallStatus]} ${CARD_BG[overallStatus]} overflow-hidden flex flex-col bg-ro-card transition-colors duration-500`}>

        {/* Ping banner */}
        {pinged && (
          <div className="flex items-center justify-between gap-2 bg-orange-500/20 border-b border-orange-500/40 px-3 py-1.5">
            <span className="text-orange-300 text-xs font-bold animate-pulse">
              📢 Pinged by {ping!.pingedBy}
            </span>
            <button
              onClick={() => onClearPing(mvp.id)}
              className="text-orange-400 hover:text-white text-xs transition-colors"
              title="Dismiss ping"
            >✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 p-3">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-ro-dark rounded overflow-hidden">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={mvp.name}
                referrerPolicy="no-referrer"
                onError={() => {
                  if (srcIndex < SPRITE_SOURCES.length - 1) setSrcIndex(srcIndex + 1);
                  else setSrcIndex(SPRITE_SOURCES.length);
                }}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <MonsterPlaceholder name={mvp.name} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <h3 className="text-white font-semibold text-sm leading-tight">{mvp.name}</h3>
              <button
                onClick={() => pinged ? onClearPing(mvp.id) : onPing(mvp.id)}
                title={pinged ? 'Clear ping' : 'Ping guild — moves this card to top'}
                className={`flex-shrink-0 text-base leading-none transition-colors ${
                  pinged ? 'text-orange-400 hover:text-orange-300' : 'text-ro-muted hover:text-orange-400'
                }`}
              >📢</button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded ${elementStyle(mvp.element)}`}>{mvp.element}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-400">{mvp.race}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-400">Lv {mvp.level}</span>
            </div>
            <p className="text-ro-muted text-xs mt-1">{(mvp.hp / 1_000_000).toFixed(1)}M HP</p>
          </div>
        </div>

        {/* Per-location rows */}
        <div className="px-3 pb-3 flex-1 space-y-3">
          {mvp.locations.map((loc, idx) => {
            const key = `${mvp.id}_${idx}`;
            const entry = timers[key];
            const rMin = loc.respawnMin ?? mvp.respawnMin;
            const rWin = loc.respawnWindow ?? mvp.respawnWindow;
            const isExpanded = !collapsedLocs.has(idx);

            return (
              <div key={idx} className="border-t border-ro-border/40 pt-2 first:border-0 first:pt-0">

                {/* Map toggle */}
                <button
                  onClick={() => toggleLoc(idx)}
                  className={`text-xs font-mono text-left transition-colors ${
                    isExpanded ? 'text-yellow-300' : 'text-ro-gold hover:text-white'
                  }`}
                  title={isExpanded ? 'Collapse map' : 'Expand map'}
                >
                  {isExpanded ? '🗺 ' : '📍 '}{loc.mapName}
                </button>

                <MVPTimerBar entry={entry} respawnMin={rMin} respawnWindow={rWin} />

                {/* Kill buttons */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => handleKilledByMe(idx)}
                    className="flex-1 bg-red-900 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded transition-colors whitespace-nowrap"
                  >
                    ☠ Killed by Me
                  </button>
                  <button
                    onClick={() => setKillByOtherLocIdx(killByOtherLocIdx === idx ? null : idx)}
                    className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors whitespace-nowrap ${
                      killByOtherLocIdx === idx
                        ? 'bg-orange-800 text-orange-200'
                        : 'bg-orange-950 hover:bg-orange-800 text-orange-300'
                    }`}
                  >
                    👁 Kill by Other
                  </button>
                  {entry && (
                    <button
                      onClick={() => onReset(mvp.id, idx)}
                      className="px-2 bg-ro-input hover:bg-ro-border text-ro-muted hover:text-white text-xs py-1.5 rounded transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Kill by Other form */}
                {killByOtherLocIdx === idx && (
                  <KillByOtherForm
                    onConfirm={(killedAt, killedBy) => handleKillByOtherConfirm(idx, killedAt, killedBy)}
                    onCancel={() => setKillByOtherLocIdx(null)}
                  />
                )}

                {/* Inline map (view-only) */}
                {isExpanded && (
                  <InlineMap
                    location={loc}
                    timerEntry={entry}
                    onRemoveTomb={() => onTombPlace(mvp.id, idx, -1, -1)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Zoomed tomb placement overlay (portal-like — position:fixed escapes overflow:hidden) */}
      {pendingTombLocIdx !== null && (
        <ZoomedTombPlacer
          mvpName={mvp.name}
          location={mvp.locations[pendingTombLocIdx]}
          onPlace={(x, y) => {
            onTombPlace(mvp.id, pendingTombLocIdx, x, y);
            setPendingTombLocIdx(null);
          }}
          onSkip={() => setPendingTombLocIdx(null)}
        />
      )}
    </>
  );
}
