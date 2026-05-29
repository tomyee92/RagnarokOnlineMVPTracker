import { useState } from 'react';

interface Props {
  roomName: string;
  inviteCode: string;
  playerName: string;
  isOnline: boolean;
  onLeave: () => void;
}

export function Header({ roomName, inviteCode, playerName, isOnline, onLeave }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-ro-card border-b border-ro-border px-4 py-3">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        {/* Left: title */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-ro-gold font-bold tracking-widest text-base sm:text-lg uppercase whitespace-nowrap">
            RagnarokRE MVP Tracker
          </h1>
          <span className="hidden sm:inline text-ro-muted text-xs bg-ro-dark px-2 py-0.5 rounded border border-ro-border whitespace-nowrap">
            Renewal EP20+
          </span>
        </div>

        {/* Right: room info */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Room name + invite code */}
          <div className="hidden sm:flex items-center gap-2 bg-ro-dark border border-ro-border rounded px-3 py-1.5">
            <div className="text-right">
              <p className="text-ro-gold text-xs font-semibold leading-none">{roomName}</p>
              <p className="text-ro-muted text-xs leading-none mt-0.5">{playerName}</p>
            </div>
            <div className="w-px h-6 bg-ro-border" />
            <button
              onClick={handleCopyCode}
              title="Copy invite code"
              className="flex flex-col items-center hover:text-white transition-colors group"
            >
              <span className="text-ro-gold font-mono text-sm font-bold tracking-widest group-hover:text-white">
                {inviteCode}
              </span>
              <span className="text-ro-muted text-[10px] leading-none">
                {copied ? '✓ copied' : 'invite code'}
              </span>
            </button>
          </div>

          {isOnline && (
            <span
              className="text-xs px-2 py-0.5 rounded border border-green-700 text-green-400"
              title="Real-time guild sync active"
            >
              ONLINE
            </span>
          )}

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
