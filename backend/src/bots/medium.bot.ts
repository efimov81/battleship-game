import type { BotObservation } from '@battleship/contracts';
import type { RandomSource } from '@battleship/core';
import { analyzeBoard, findPlacements, key } from './board-analysis.js';
import { fallback, type BotDecision } from './decision.js';

export class MediumBot {
  constructor(private readonly random: RandomSource) {}

  decide(observation: BotObservation): BotDecision {
    const board = analyzeBoard(observation);
    const placements = findPlacements(observation, board);
    const maxHits = placements.reduce((max, placement) => Math.max(max, placement.hits), 0);
    const relevant = placements.filter((placement) => placement.hits === maxHits);
    const possible = new Set(relevant.flatMap((placement) => placement.cells.map(key)));
    const candidates = board.available.filter((cell) => possible.has(key(cell)));
    if (!candidates.length) return fallback(board);

    if (maxHits > 0) {
      return {
        coordinate: candidates[this.random.nextInt(candidates.length)],
        mode: 'target',
        reason: maxHits > 1 ? 'Extend a line of hits' : 'Follow up on a hit',
      };
    }

    const stride = Math.min(...observation.remainingEnemyShipSizes.filter((size) => size > 1));
    const diagonals = candidates.filter(({ x, y }) => !Number.isFinite(stride) || (x + y) % stride === 0);
    const pool = diagonals.length && this.random.nextInt(10) !== 0 ? diagonals : candidates;
    return { coordinate: pool[this.random.nextInt(pool.length)], mode: 'search', reason: 'Search feasible ship placements' };
  }
}
