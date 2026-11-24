import type { BotObservation, Coordinate } from '@battleship/contracts';

export const key = ({ x, y }: Coordinate): string => `${x},${y}`;

export function neighbors({ x, y }: Coordinate): Coordinate[] {
  return [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => ({ x: x + dx, y: y + dy })));
}

export function analyzeBoard(observation: BotObservation) {
  const { boardSize } = observation.rules;
  const cells = Array.from({ length: boardSize ** 2 }, (_, i) => ({
    x: i % boardSize,
    y: Math.floor(i / boardSize),
  }));
  const fired = new Set(observation.ownShots.map((shot) => key(shot.coordinate)));
  const blocked = new Set<string>();
  const hits = new Map<string, Coordinate>();
  for (const shot of observation.ownShots) {
    const id = key(shot.coordinate);
    if (shot.outcome === 'miss') blocked.add(id);
    if (shot.outcome === 'hit') hits.set(id, shot.coordinate);
    if (shot.outcome === 'sunk') {
      const sunk = shot.sunkShipCells ?? [shot.coordinate];
      // Older records identify the final hit but omit the ship's cells.
      if (!shot.sunkShipCells) {
        const seen = new Set(sunk.map(key));
        for (const cell of sunk) {
          for (const neighbor of neighbors(cell)) {
            const id = key(neighbor);
            if (!seen.has(id) && hits.has(id)) {
              seen.add(id);
              sunk.push(neighbor);
            }
          }
        }
      }
      for (const cell of sunk) {
        hits.delete(key(cell));
        for (const neighbor of neighbors(cell)) blocked.add(key(neighbor));
      }
    }
  }
  return {
    cells,
    fired,
    blocked,
    hits,
    available: cells.filter((cell) => !fired.has(key(cell)) && !blocked.has(key(cell))),
  };
}

export interface Placement {
  cells: Coordinate[];
  hits: number;
  size: number;
}

export function findPlacements(observation: BotObservation, board: ReturnType<typeof analyzeBoard>): Placement[] {
  const placements: Placement[] = [];
  for (const size of new Set(observation.remainingEnemyShipSizes)) {
    for (const start of board.cells) {
      for (const [dx, dy] of size === 1 ? [[1, 0]] : [[1, 0], [0, 1]]) {
        const cells = Array.from({ length: size }, (_, i) => ({ x: start.x + i * dx, y: start.y + i * dy }));
        if (cells.some((cell) => cell.x >= observation.rules.boardSize || cell.y >= observation.rules.boardSize
          || board.blocked.has(key(cell)))) continue;
        const occupied = new Set(cells.map(key));
        const hits = cells.filter((cell) => board.hits.has(key(cell))).length;
        if (hits === size || cells.some((cell) =>
          neighbors(cell).some((neighbor) => board.hits.has(key(neighbor)) && !occupied.has(key(neighbor))))) continue;
        placements.push({ cells, hits, size });
      }
    }
  }
  return placements;
}
