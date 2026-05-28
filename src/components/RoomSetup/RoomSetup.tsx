import { useState } from 'react';

interface Props {
  onJoin: (roomCode: string, playerName: string) => void;
}

export function RoomSetup({ onJoin }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim() && playerName.trim()) {
      onJoin(roomCode, playerName);
    }
  };

  return (
    <div className="min-h-screen bg-ro-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ro-gold mb-2 tracking-widest uppercase">
            RagnarokRE
          </h1>
          <p className="text-ro-gold/60 text-sm tracking-widest">MVP TRACKER</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-ro-card border border-ro-border rounded-lg p-6 shadow-2xl"
        >
          <h2 className="text-ro-gold font-semibold text-lg mb-6 text-center">Join Guild Room</h2>

          <div className="mb-4">
            <label className="block text-ro-muted text-sm mb-1 tracking-wide">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="e.g. guild-ymir"
              className="w-full bg-ro-input border border-ro-border rounded px-3 py-2 text-white placeholder-ro-muted focus:outline-none focus:border-ro-gold transition-colors"
              required
            />
            <p className="text-ro-muted text-xs mt-1">Share this code with your guildmates</p>
          </div>

          <div className="mb-6">
            <label className="block text-ro-muted text-sm mb-1 tracking-wide">
              Character Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your character name"
              className="w-full bg-ro-input border border-ro-border rounded px-3 py-2 text-white placeholder-ro-muted focus:outline-none focus:border-ro-gold transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-ro-gold hover:bg-ro-gold/80 text-ro-dark font-bold py-2 px-4 rounded transition-colors tracking-wide"
          >
            ENTER
          </button>
        </form>
      </div>
    </div>
  );
}
