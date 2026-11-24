export interface Coordinate {
  x: number;
  y: number;
}

export interface Ship {
  id: string;
  cells: Coordinate[];
}

export interface Fleet {
  ships: Ship[];
}

export type PlayerId = 'human' | 'bot';
export type GamePhase = 'setup' | 'playing' | 'finished';
export type ShotOutcome = 'hit' | 'miss' | 'sunk';

export interface ShotRecord {
  coordinate: Coordinate;
  shooter: PlayerId;
  outcome: ShotOutcome;
  sunkShipSize?: number;
  sunkShipId?: string;
  sunkShipCells?: Coordinate[];
}

export interface PublicCell {
  x: number;
  y: number;
  state: 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';
}

export interface PublicGameView {
  id: string;
  phase: GamePhase;
  currentTurn: PlayerId;
  humanFleet: Fleet | null;
  ownBoard: PublicCell[];
  enemyBoard: PublicCell[];
  winner: PlayerId | null;
  history: ShotRecord[];
}

export interface BotObservation {
  rules: {
    boardSize: number;
    fleetSizes: number[];
  };
  ownShots: Array<ShotRecord>;
  remainingEnemyShipSizes: number[];
}
