import { GameError } from '@battleship/core';
import type { Coordinate } from '@battleship/contracts';
import { analyzeBoard, key } from './board-analysis.js';

export interface BotDecision {
  coordinate: Coordinate;
  mode: 'search' | 'target';
  reason: string;
  score?: number;
}

export function fallback(board: ReturnType<typeof analyzeBoard>): BotDecision {
  const coordinate = board.available[0] ?? board.cells.find((cell) => !board.fired.has(key(cell)));
  if (!coordinate) throw new GameError('NO_LEGAL_MOVES', 'No legal bot shots remain');
  return { coordinate, mode: board.hits.size ? 'target' : 'search', reason: 'Remaining legal cell' };
}
