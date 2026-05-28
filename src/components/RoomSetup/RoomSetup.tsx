import { useState } from 'react';
import type { RoomError } from '../../hooks/useRoom';

interface Props {
  loading: boolean;
  error: RoomError;
  onCreate: (roomName: string, playerName: string) => Promise<string>;
  onJoin: (inviteCode: string, playerName: string) => Promise<void>;
}

export function RoomSetup({ loading, error, onCreate, onJoin }: Props) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !playerName.trim()) return;
    const code = await onCreate(roomName, playerName);
    setCreatedCode(code);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !playerName.trim()) return;
    await onJoin(inviteCode, playerName);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdCode!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-ro-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ro-gold mb-1 tracking-widest uppercase">RagnarokRE</h1>
          <p className="text-ro-gold/60 text-sm tracking-widest uppercase">MVP Tracker</p>
          <p className="text-ro-muted text-xs mt-1">Renewal EP20+ · Guild Coordination Tool</p>
        </div>

        <div className="bg-ro-card border border-ro-border rounded-lg shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-ro-border">
            <button
              onClick={() => { setTab('create'); setCreatedCode(null); }}
              className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-colors ${
                tab === 'create'
                  ? 'text-ro-gold border-b-2 border-ro-gold bg-ro-dark/50'
                  : 'text-ro-muted hover:text-white'
              }`}
            >
              CREATE ROOM
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-colors ${
                tab === 'join'
                  ? 'text-ro-gold border-b-2 border-ro-gold bg-ro-dark/50'
                  : 'text-ro-muted hover:text-white'
              }`}
            >
              JOIN ROOM
            </button>
          </div>

          <div className="p-6">
            {/* Create Room */}
            {tab === 'create' && !createdCode && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-ro-muted text-xs mb-1 tracking-wide uppercase">Guild / Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Xcution"
                    maxLength={30}
                    className="w-full bg-ro-input border border-ro-border rounded px-3 py-2 text-white placeholder-ro-muted focus:outline-none focus:border-ro-gold transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-ro-muted text-xs mb-1 tracking-wide uppercase">Your Character Name</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="e.g. BattleMonk"
                    maxLength={24}
                    className="w-full bg-ro-input border border-ro-border rounded px-3 py-2 text-white placeholder-ro-muted focus:outline-none focus:border-ro-gold transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ro-gold hover:bg-ro-gold/80 disabled:opacity-50 text-ro-dark font-bold py-2 px-4 rounded transition-colors tracking-wide"
                >
                  {loading ? 'Creating...' : 'CREATE ROOM'}
                </button>
              </form>
            )}

            {/* Created — show invite code */}
            {tab === 'create' && createdCode && (
              <div className="text-center space-y-4">
                <div>
                  <p className="text-ro-muted text-sm mb-2">Room created! Share this invite code:</p>
                  <div className="bg-ro-dark border border-ro-gold/40 rounded-lg px-6 py-4">
                    <span className="text-ro-gold text-4xl font-mono font-bold tracking-[0.3em]">{createdCode}</span>
                  </div>
                </div>
                <p className="text-ro-muted text-xs">
                  Your guildmates go to <span className="text-white">Join Room</span> and enter this code.
                  Up to 100+ players can use the same code simultaneously.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 bg-ro-input hover:bg-ro-border border border-ro-border text-white text-sm py-2 rounded transition-colors"
                  >
                    {copied ? '✓ Copied!' : 'Copy Code'}
                  </button>
                  <button
                    onClick={() => onJoin(createdCode, playerName)}
                    className="flex-1 bg-ro-gold hover:bg-ro-gold/80 text-ro-dark font-bold text-sm py-2 rounded transition-colors"
                  >
                    Enter Room
                  </button>
                </div>
              </div>
            )}

            {/* Join Room */}
            {tab === 'join' && (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-ro-muted text-xs mb-1 tracking-wide uppercase">Invite Code</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. XCT283"
                    maxLength={6}
                    className="w-full bg-ro-input border border-ro-border rounded px-3 py-2 text-white placeholder-ro-muted focus:outline-none focus:border-ro-gold transition-colors font-mono text-lg tracking-widest text-center uppercase"
                    required
                  />
                  {error === 'not-found' && (
                    <p className="text-red-400 text-xs mt-1">Room not found. Check the invite code and try again.</p>
                  )}
                  {error === 'network' && (
                    <p className="text-red-400 text-xs mt-1">Network error. Check your connection.</p>
                  )}
                </div>
                <div>
                  <label className="block text-ro-muted text-xs mb-1 tracking-wide uppercase">Your Character Name</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="e.g. LordKnight"
                    maxLength={24}
                    className="w-full bg-ro-input border border-ro-border rounded px-3 py-2 text-white placeholder-ro-muted focus:outline-none focus:border-ro-gold transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ro-gold hover:bg-ro-gold/80 disabled:opacity-50 text-ro-dark font-bold py-2 px-4 rounded transition-colors tracking-wide"
                >
                  {loading ? 'Joining...' : 'JOIN ROOM'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
