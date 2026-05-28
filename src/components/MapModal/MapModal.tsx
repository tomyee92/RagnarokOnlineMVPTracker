import { useEffect } from 'react';
import type { MVPEntry } from '../../types';

interface Props {
  mvp: MVPEntry;
  locationIndex: number;
  onClose: () => void;
}

const MAP_IMG_BASE = 'https://www.divine-pride.net/img/maps/original';

export function MapModal({ mvp, locationIndex, onClose }: Props) {
  const location = mvp.locations[locationIndex];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-ro-card border border-ro-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ro-border">
          <div>
            <h2 className="text-ro-gold font-bold">{mvp.name}</h2>
            <p className="text-ro-muted text-sm">{location.mapName} ({location.map})</p>
          </div>
          <button
            onClick={onClose}
            className="text-ro-muted hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="relative bg-ro-dark rounded overflow-hidden">
            <img
              src={`${MAP_IMG_BASE}/${location.map}.png`}
              alt={`Map of ${location.mapName}`}
              className="w-full h-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {location.x !== undefined && location.y !== undefined && (
              <div className="absolute" style={{
                left: `${(location.x / 512) * 100}%`,
                bottom: `${(location.y / 512) * 100}%`,
                transform: 'translate(-50%, 50%)',
              }}>
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping absolute" />
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white relative" />
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-ro-dark rounded p-3">
              <p className="text-ro-muted text-xs mb-1">Element / Race</p>
              <p className="text-white">{mvp.element} / {mvp.race}</p>
            </div>
            <div className="bg-ro-dark rounded p-3">
              <p className="text-ro-muted text-xs mb-1">Respawn</p>
              <p className="text-white">{mvp.respawnMin}min (+{mvp.respawnWindow}min window)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
