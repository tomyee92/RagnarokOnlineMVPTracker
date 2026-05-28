import { useState, useCallback } from 'react';
import { ref, set, get } from 'firebase/database';
import { getDb } from '../firebase/config';
import type { Room, RoomState } from '../types';

const STORAGE_KEY = 'ro-mvp-room-v2';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function loadRoomState(): RoomState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RoomState;
  } catch {
    return null;
  }
}

function saveRoomState(state: RoomState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export type RoomError = 'not-found' | 'network' | null;

export function useRoom() {
  const [roomState, setRoomState] = useState<RoomState | null>(loadRoomState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RoomError>(null);

  const createRoom = useCallback(async (roomName: string, playerName: string) => {
    setLoading(true);
    setError(null);
    const inviteCode = generateInviteCode();
    const room: Room = {
      name: roomName.trim(),
      inviteCode,
      createdBy: playerName.trim(),
      createdAt: Date.now(),
    };
    const state: RoomState = { room, playerName: playerName.trim() };

    const db = getDb();
    if (db) {
      try {
        await set(ref(db, `rooms/${inviteCode}/info`), room);
      } catch {
        // fall through to local mode
      }
    }

    saveRoomState(state);
    setRoomState(state);
    setLoading(false);
    return inviteCode;
  }, []);

  const joinRoom = useCallback(async (inviteCode: string, playerName: string) => {
    setLoading(true);
    setError(null);
    const code = inviteCode.trim().toUpperCase();

    const db = getDb();
    if (db) {
      try {
        const snap = await get(ref(db, `rooms/${code}/info`));
        if (!snap.exists()) {
          setError('not-found');
          setLoading(false);
          return;
        }
        const room = snap.val() as Room;
        const state: RoomState = { room, playerName: playerName.trim() };
        saveRoomState(state);
        setRoomState(state);
      } catch {
        setError('network');
      }
    } else {
      // Local mode: accept any code, create a placeholder room
      const room: Room = { name: code, inviteCode: code, createdBy: playerName.trim(), createdAt: Date.now() };
      const state: RoomState = { room, playerName: playerName.trim() };
      saveRoomState(state);
      setRoomState(state);
    }

    setLoading(false);
  }, []);

  const leaveRoom = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRoomState(null);
    setError(null);
  }, []);

  return { roomState, loading, error, createRoom, joinRoom, leaveRoom };
}
