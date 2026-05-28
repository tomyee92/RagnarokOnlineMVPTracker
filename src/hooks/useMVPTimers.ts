import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { getDb } from '../firebase/config';
import type { TimersMap, TimerEntry } from '../types';

export function useMVPTimers(roomCode: string | null) {
  const [timers, setTimers] = useState<TimersMap>({});
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const db = getDb();
    setIsOnline(!!db);
    if (!roomCode || !db) {
      setTimers({});
      return;
    }
    const timersRef = ref(db, `rooms/${roomCode}/timers`);
    const unsub = onValue(timersRef, (snapshot) => {
      const data = snapshot.val() as TimersMap | null;
      setTimers(data ?? {});
    });
    return unsub;
  }, [roomCode]);

  const recordKill = useCallback(
    (mvpId: number, locationIndex: number, playerName: string) => {
      const db = getDb();
      const key = `${mvpId}_${locationIndex}`;
      const entry: TimerEntry = {
        killedAt: Date.now(),
        killedBy: playerName,
        updatedAt: Date.now(),
      };
      if (db && roomCode) {
        set(ref(db, `rooms/${roomCode}/timers/${key}`), entry);
      } else {
        setTimers((prev) => ({ ...prev, [key]: entry }));
      }
    },
    [roomCode]
  );

  const resetTimer = useCallback(
    (mvpId: number, locationIndex: number) => {
      const db = getDb();
      const key = `${mvpId}_${locationIndex}`;
      if (db && roomCode) {
        remove(ref(db, `rooms/${roomCode}/timers/${key}`));
      } else {
        setTimers((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [roomCode]
  );

  return { timers, recordKill, resetTimer, isOnline };
}
