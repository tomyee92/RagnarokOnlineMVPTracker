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

const DEFAULT_FILTER: FilterState = { search: '', status: 'all', element: '', race: '' };

interface MapSelection { mvp: MVPEntry; locationIndex: number; }

export default function App() {
  const { roomState, loading, error, createRoom, joinRoom, leaveRoom } = useRoom();
  const inviteCode = roomState?.room.inviteCode ?? null;
  const { timers, recordKill, placeTomb, resetTimer, isOnline } = useMVPTimers(inviteCode);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [mapSel, setMapSel] = useState<MapSelection | null>(null);

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
        filter={filter}
        onKill={(mvpId, locationIndex) => recordKill(mvpId, locationIndex, playerName)}
        onReset={resetTimer}
        onMapClick={(mvp, locationIndex) => setMapSel({ mvp, locationIndex })}
      />
      {mapSel && (
        <MapModal
          mvp={mapSel.mvp}
          locationIndex={mapSel.locationIndex}
          timerEntry={timers[`${mapSel.mvp.id}_${mapSel.locationIndex}`]}
          onClose={() => setMapSel(null)}
          onTombPlace={(x, y) => {
            if (x === -1) {
              // Remove tomb: update entry without tombX/tombY
              placeTomb(mapSel.mvp.id, mapSel.locationIndex, -1, -1);
            } else {
              placeTomb(mapSel.mvp.id, mapSel.locationIndex, x, y);
            }
          }}
        />
      )}
    </div>
  );
}
