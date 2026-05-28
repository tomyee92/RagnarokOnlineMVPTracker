import { useState } from 'react';
import { RoomSetup } from './components/RoomSetup/RoomSetup';
import { Header } from './components/Layout/Header';
import { FilterBar } from './components/FilterBar/FilterBar';
import { MVPGrid } from './components/MVPGrid/MVPGrid';
import { MapModal } from './components/MapModal/MapModal';
import { useRoom } from './hooks/useRoom';
import { useMVPTimers } from './hooks/useMVPTimers';
import { MVPS } from './data/mvps';
import type { FilterState, MVPEntry } from './types';

const DEFAULT_FILTER: FilterState = {
  search: '',
  status: 'all',
  element: '',
  race: '',
};

interface MapSelection {
  mvp: MVPEntry;
  locationIndex: number;
}

export default function App() {
  const { room, joinRoom, leaveRoom } = useRoom();
  const { timers, recordKill, resetTimer, isOnline } = useMVPTimers(room?.roomCode ?? null);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [mapSelection, setMapSelection] = useState<MapSelection | null>(null);

  if (!room) {
    return <RoomSetup onJoin={joinRoom} />;
  }

  return (
    <div className="min-h-screen bg-ro-dark flex flex-col">
      <Header
        roomCode={room.roomCode}
        playerName={room.playerName}
        isOnline={isOnline}
        onLeave={leaveRoom}
      />
      <FilterBar filter={filter} onChange={setFilter} />
      <MVPGrid
        mvps={MVPS}
        timers={timers}
        filter={filter}
        playerName={room.playerName}
        onKill={(mvpId, locationIndex) => recordKill(mvpId, locationIndex, room.playerName)}
        onReset={resetTimer}
        onMapClick={(mvp, locationIndex) => setMapSelection({ mvp, locationIndex })}
      />
      {mapSelection && (
        <MapModal
          mvp={mapSelection.mvp}
          locationIndex={mapSelection.locationIndex}
          onClose={() => setMapSelection(null)}
        />
      )}
    </div>
  );
}
