import { useEffect, useState } from 'react';
import type { MVPEntry, TimerEntry } from '../../types';

interface Props {
  mvp: MVPEntry;
  locationIndex: number;
  timerEntry: TimerEntry | undefined;
  onClose: () => void;
  onTombPlace: (tombX: number, tombY: number) => void;
}

// Local bundled map images (JPG from ratemyserver), no CDN hotlink needed
const BASE = import.meta.env.BASE_URL;
const MAP_SOURCES = [
  (mapCode: string) => `${BASE}assets/maps/${mapCode}.jpg`,
  (mapCode: string) => `https://www.ratemyserver.net/images/maps/${mapCode}.jpg`,
  (mapCode: string) => `https://www.ratemyserver.net/images/world/${mapCode}.jpg`,
];

export function MapModal({ mvp, locationIndex, timerEntry, onClose, onTombPlace }: Props) {
  const location = mvp.locations[locationIndex];
  const [mapSrcIndex, setMapSrcIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [placingTomb, setPlacingTomb] = useState(false);

  const mapSrc = MAP_SOURCES[mapSrcIndex]?.(location.map);

  useEffect(() => {
    setMapSrcIndex(0);
    setMapLoaded(false);
  }, [location.map]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingTomb) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onTombPlace(x, y);
    setPlacingTomb(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-ro-card border border-ro-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ro-border">
          <div>
            <h2 className="text-ro-gold font-bold">{mvp.name}</h2>
            <p className="text-ro-muted text-sm font-mono">{location.mapName} ({location.map})</p>
          </div>
          <button onClick={onClose} className="text-ro-muted hover:text-white text-2xl leading-none transition-colors">×</button>
        </div>

        {/* Map */}
        <div className="p-4">
          <div
            className={`relative bg-ro-dark rounded overflow-hidden ${placingTomb ? 'cursor-crosshair ring-2 ring-yellow-400' : ''}`}
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
                className="w-full h-auto block"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center text-ro-muted text-sm">
                Map image unavailable for <span className="font-mono ml-1">{location.map}</span>
              </div>
            )}

            {/* Tomb marker from timer */}
            {timerEntry?.tombX !== undefined && timerEntry.tombY !== undefined && mapLoaded && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${timerEntry.tombX * 100}%`,
                  top: `${timerEntry.tombY * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-3 bg-red-500/20 rounded-full animate-ping" />
                  <span className="text-2xl relative z-10" title={`Killed by ${timerEntry.killedBy}`}>☠</span>
                </div>
              </div>
            )}

            {/* Placing crosshair hint */}
            {placingTomb && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/60 text-yellow-300 text-sm px-3 py-1.5 rounded font-semibold">
                  Click to place tomb
                </div>
              </div>
            )}
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setPlacingTomb(!placingTomb)}
              className={`text-sm px-3 py-1.5 rounded border transition-colors ${
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
                className="text-sm px-3 py-1.5 rounded border border-ro-border bg-ro-input text-ro-muted hover:text-white transition-colors"
              >
                Remove Tomb
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
            <div className="bg-ro-dark rounded p-2">
              <p className="text-ro-muted text-xs mb-0.5">Element</p>
              <p className="text-white font-medium">{mvp.element}</p>
            </div>
            <div className="bg-ro-dark rounded p-2">
              <p className="text-ro-muted text-xs mb-0.5">Race / Size</p>
              <p className="text-white font-medium">{mvp.race} · {mvp.size}</p>
            </div>
            <div className="bg-ro-dark rounded p-2">
              <p className="text-ro-muted text-xs mb-0.5">Respawn</p>
              <p className="text-white font-medium">{mvp.respawnMin}~{mvp.respawnMin + mvp.respawnWindow} min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
