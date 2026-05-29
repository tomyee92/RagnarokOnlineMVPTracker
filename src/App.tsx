import { useState } from 'react';
import { RoomSetup } from './components/RoomSetup/RoomSetup';
import { Header } from './components/Layout/Header';
import { FilterBar } from './components/FilterBar/FilterBar';
import { MVPGrid } from './components/MVPGrid/MVPGrid';
import { useRoom } from './hooks/useRoom';
import { useMVPTimers } from './hooks/useMVPTimers';
import { MVPS } from './data/mvps';
import type { FilterState } from './types';

const DEFAULT_FILTER: FilterState = { search: '', status: 'all', element: '', race: '' };

export default function App() {
  const { roomState, loading, error, createRoom, joinRoom, leaveRoom } = useRoom();
  const inviteCode = roomState?.room.inviteCode ?? null;
  const { timers, pings, recordKill, placeTomb, resetTimer, pingMVP, clearPing, isOnline } = useMVPTimers(inviteCode);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  if (!roomState) {
    return (
      <RoomSetup
        loading={loading}
        error={error}
        onCreate={createRoom}
        onJoin={joinRoom}
      />
    );
  }

  const { room, playerName } = roomState;

  return (
    <div className="min-h-screen bg-ro-dark flex flex-col">
      <Header
        roomName={room.name}
        inviteCode={room.inviteCode}
        playerName={playerName}
        isOnline={isOnline}
        onLeave={leaveRoom}
      />
      <FilterBar filter={filter} onChange={setFilter} />
      <MVPGrid
        mvps={MVPS}
        timers={timers}
        pings={pings}
        filter={filter}
        onKill={(mvpId, locationIndex) => recordKill(mvpId, locationIndex, playerName)}
        onReset={resetTimer}
        onTombPlace={(mvpId, locationIndex, x, y) => placeTomb(mvpId, locationIndex, x, y)}
        onPing={(mvpId) => pingMVP(mvpId, playerName)}
        onClearPing={clearPing}
      />
    </div>
  );
}
