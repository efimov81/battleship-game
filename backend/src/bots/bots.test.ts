import { describe, expect, it } from 'vitest';
import { GameFactory, FleetGenerator, SeededRandom } from '@battleship/core';
import type { BotObservation, Coordinate, ShotRecord } from '@battleship/contracts';
import { createBot } from './bot.factory.js';

function observation(ownShots: ShotRecord[], remainingEnemyShipSizes = [3]): BotObservation {
  return { ownShots, remainingEnemyShipSizes, rules: { boardSize: 10, fleetSizes: [3, 2] } };
}

function shot(x: number, y: number, outcome: ShotRecord['outcome']): ShotRecord {
  return { coordinate: { x, y }, shooter: 'bot', outcome };
}

describe.each(['medium', 'hard'])('%s strategy', (id) => {
  it('extends a line at the edge when only one end is possible', () => {
    const bot = createBot(id, new SeededRandom(2), () => {})!;
    expect(bot.chooseShot(observation([shot(0, 0, 'hit'), shot(1, 0, 'hit')]))).toEqual({ x: 2, y: 0 });
  });

  it('avoids the diagonal and orthogonal neighbors of a sunk ship', () => {
    const bot = createBot(id, new SeededRandom(3), () => {})!;
    const position = observation([shot(4, 4, 'hit'), shot(5, 4, 'sunk')], [1]);
    const { x, y } = bot.chooseShot(position);
    expect(Math.abs(y - 4) > 1 || x < 3 || x > 6).toBe(true);
  });

  it('can choose the last remaining cell for a single-cell ship', () => {
    const bot = createBot(id, new SeededRandom(4), () => {})!;
    const misses = Array.from({ length: 99 }, (_, i) => shot(i % 10, Math.floor(i / 10), 'miss'));
    expect(bot.chooseShot(observation(misses, [1]))).toEqual({ x: 9, y: 9 });
  });
});

it.each(['random', 'medium', 'hard'])('%s completes a game through single-shot turns', (id) => {
  for (const seed of [33, 42, 71]) {
    const random = new SeededRandom(seed);
    const humanFleet = new FleetGenerator(random).generate();
    const bot = createBot(id, random, () => {})!;
    const session = new GameFactory(random).create({ bot, humanFleet });
    const humanCells: Coordinate[] = Array.from({ length: 100 }, (_, i) => ({ x: i % 10, y: Math.floor(i / 10) }));
    session.start();
    let turns = 0;
    while (session.phase === 'playing') {
      if (session.currentTurn === 'human') session.shoot('human', humanCells.shift()!);
      else {
        const count = session.history.length;
        const result = session.playBotShot()!;
        expect(session.history).toHaveLength(count + 1);
        if (!result.gameEnded) expect(result.currentTurn).toBe(result.outcome === 'miss' ? 'human' : 'bot');
      }
      expect(++turns).toBeLessThanOrEqual(200);
    }
    expect(session.winner).toBeTruthy();
    expect(session.playBotShot()).toBeNull();
  }
});
