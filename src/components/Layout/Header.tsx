interface Props {
  roomCode: string;
  playerName: string;
  isOnline: boolean;
  onLeave: () => void;
}

export function Header({ roomCode, playerName, isOnline, onLeave }: Props) {
  return (
    <header className="bg-ro-card border-b border-ro-border px-4 py-3">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-ro-gold font-bold tracking-widest text-lg uppercase">
            RagnarokRE MVP Tracker
          </h1>
          <span className="hidden sm:inline text-ro-muted text-xs bg-ro-dark px-2 py-0.5 rounded border border-ro-border">
            Renewal EP20+
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-ro-gold text-xs font-medium">{playerName}</p>
            <p className="text-ro-muted text-xs">Room: {roomCode}</p>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded border ${
              isOnline
                ? 'border-green-700 text-green-400'
                : 'border-yellow-800 text-yellow-600'
            }`}
            title={isOnline ? 'Timers synced with guild in real-time' : 'Local mode — timers not shared. Add Firebase config to enable guild sync.'}
          >
            {isOnline ? 'ONLINE' : 'LOCAL'}
          </span>
          <button
            onClick={onLeave}
            className="text-ro-muted hover:text-white text-xs border border-ro-border hover:border-white/40 px-3 py-1 rounded transition-colors"
          >
            Leave
          </button>
        </div>
      </div>
    </header>
  );
}
