import type { BotObservation } from '@battleship/contracts';
import { analyzeBoard, findPlacements, key, neighbors, type Placement } from './board-analysis.js';
import { fallback, type BotDecision } from './decision.js';

export class HardBot {
  decide(observation: BotObservation): BotDecision {
    const board = analyzeBoard(observation);
    const counts = new Map<number, number>();
    for (const size of observation.remainingEnemyShipSizes) counts.set(size, (counts.get(size) ?? 0) + 1);
    const placements = findPlacements(observation, board);
    const targets = placements.filter((placement) => placement.hits > 0);
    const byHit = new Map([...board.hits.keys()].map((id) => [
      id, targets.filter((placement) => placement.cells.some((cell) => key(cell) === id)),
    ]));
    const scores = new Map<string, number>();
    const score = (placement: Placement, weight: number) => {
      for (const cell of placement.cells) {
        const id = key(cell);
        if (!board.fired.has(id)) scores.set(id, (scores.get(id) ?? 0) + weight);
      }
    };

    // Enumerate compatible explanations of outstanding hits with a fixed work limit.
    // The accumulated weights are heuristic scores, not fleet probabilities.
    let budget = 4000;
    const selected: Placement[] = [];
    const coverHits = (covered: Set<string>, blocked: Set<string>) => {
      if (budget-- <= 0) return;
      const next = [...byHit.keys()].find((id) => !covered.has(id));
      if (next === undefined) {
        for (const placement of selected) score(placement, placement.hits / (placement.size - placement.hits));
        return;
      }
      for (const placement of byHit.get(next) ?? []) {
        if (budget <= 0) break;
        const count = counts.get(placement.size) ?? 0;
        if (!count || placement.cells.some((cell) => blocked.has(key(cell)))) continue;
        counts.set(placement.size, count - 1);
        selected.push(placement);
        coverHits(new Set([...covered, ...placement.cells.map(key)]),
          new Set([...blocked, ...placement.cells.flatMap(neighbors).map(key)]));
        selected.pop();
        counts.set(placement.size, count);
      }
    };

    if (targets.length) coverHits(new Set(), new Set());
    if (!scores.size) {
      for (const placement of targets.length ? targets : placements) {
        score(placement, (counts.get(placement.size) ?? 0) * (1 + placement.hits));
      }
    }
    let best: BotDecision | undefined;
    for (const coordinate of board.available) {
      const value = scores.get(key(coordinate)) ?? 0;
      if (value > (best?.score ?? 0)) {
        best = { coordinate, score: value, mode: targets.length ? 'target' : 'search',
          reason: targets.length ? 'Compatible explanations of outstanding hits' : 'Weighted coverage of legal placements' };
      }
    }
    return best ?? fallback(board);
  }
}
