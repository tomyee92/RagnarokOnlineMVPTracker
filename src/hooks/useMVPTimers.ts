import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, remove, update, type DatabaseReference } from 'firebase/database';
import { getDb } from '../firebase/config';
import type { TimersMap, TimerEntry } from '../types';

export function useMVPTimers(inviteCode: string | null) {
  const [timers, setTimers] = useState<TimersMap>({});
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const db = getDb();
    setIsOnline(!!db);
    if (!inviteCode || !db) {
      setTimers({});
      return;
    }
    const timersRef = ref(db, `rooms/${inviteCode}/timers`);
    const unsub = onValue(timersRef, (snapshot) => {
      setTimers((snapshot.val() as TimersMap) ?? {});
    });
    return unsub;
  }, [inviteCode]);

  const recordKill = useCallback(
    (mvpId: number, locationIndex: number, playerName: string) => {
      const db = getDb();
      const key = `${mvpId}_${locationIndex}`;
      const entry: TimerEntry = { killedAt: Date.now(), killedBy: playerName, updatedAt: Date.now() };
      if (db && inviteCode) {
        set(ref(db, `rooms/${inviteCode}/timers/${key}`), entry);
      } else {
        setTimers((prev) => ({ ...prev, [key]: entry }));
      }
    },
    [inviteCode]
  );

  const placeTomb = useCallback(
    (mvpId: number, locationIndex: number, tombX: number, tombY: number) => {
      const db = getDb();
      const key = `${mvpId}_${locationIndex}`;
      const removing = tombX === -1;
      if (db && inviteCode) {
        const nodeRef: DatabaseReference = ref(db, `rooms/${inviteCode}/timers/${key}`);
        if (removing) {
          update(nodeRef, { tombX: null, tombY: null });
        } else {
          update(nodeRef, { tombX, tombY });
        }
      } else {
        setTimers((prev) => {
          const existing = prev[key];
          if (!existing) return prev;
          if (removing) {
            const { tombX: _x, tombY: _y, ...rest } = existing;
            return { ...prev, [key]: rest };
          }
          return { ...prev, [key]: { ...existing, tombX, tombY } };
        });
      }
    },
    [inviteCode]
  );

  const resetTimer = useCallback(
    (mvpId: number, locationIndex: number) => {
      const db = getDb();
      const key = `${mvpId}_${locationIndex}`;
      if (db && inviteCode) {
        remove(ref(db, `rooms/${inviteCode}/timers/${key}`));
      } else {
        setTimers((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [inviteCode]
  );

  return { timers, recordKill, placeTomb, resetTimer, isOnline };
}
