import { useState, useCallback } from 'react';
import type { RoomState } from '../types';

const STORAGE_KEY = 'ro-mvp-room';

function loadRoom(): RoomState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RoomState;
  } catch {
    return null;
  }
}

function saveRoom(state: RoomState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useRoom() {
  const [room, setRoom] = useState<RoomState | null>(loadRoom);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    const state: RoomState = {
      roomCode: roomCode.trim().toLowerCase(),
      playerName: playerName.trim(),
    };
    saveRoom(state);
    setRoom(state);
  }, []);

  const leaveRoom = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRoom(null);
  }, []);

  return { room, joinRoom, leaveRoom };
}
