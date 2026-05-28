export interface MVPSpawnLocation {
  map: string;
  mapName: string;
  x?: number;
  y?: number;
}

export interface MVPDrop {
  itemId: number;
  itemName: string;
  chance: number;
}

export type MVPSize = 'Small' | 'Medium' | 'Large';

export interface MVPEntry {
  id: number;
  name: string;
  level: number;
  hp: number;
  element: string;
  race: string;
  size: MVPSize;
  respawnMin: number;
  respawnWindow: number;
  locations: MVPSpawnLocation[];
  mvpDrops: MVPDrop[];
  tags: string[];
}

export type TimerStatus = 'unknown' | 'dead' | 'window' | 'alive';

export interface TimerEntry {
  killedAt: number;
  killedBy: string;
  updatedAt: number;
  tombX?: number;  // normalized 0-1 position on map image
  tombY?: number;
}

export type TimersMap = Record<string, TimerEntry>;

export interface Room {
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: number;
}

export interface RoomState {
  room: Room;
  playerName: string;
}

export type FilterStatus = 'all' | TimerStatus;

export interface FilterState {
  search: string;
  status: FilterStatus;
  element: string;
  race: string;
}
