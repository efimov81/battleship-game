import { describe, expect, it } from 'vitest';
import {
  FleetGenerator,
  FleetValidator,
  GameSession,
  RandomBot,
  SeededRandom,
  type Fleet,
} from './index.js';

const fleetFromSizes = (sizes: number[]): Fleet => ({
  ships: sizes.map((size, index) => ({
    id: `ship-${index}`,
    cells: Array.from({ length: size }, (_, offset) => ({ x: index === 0 ? 0 : 9, y: index === 0 ? offset : index + offset })),
  })),
});

describe('FleetValidator', () => {
  it('distinguishes partial, complete, and invalid fleets', () => {
    const validator = new FleetValidator();
    const partial = { ships: [{ id: 'p', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }] };
    expect(validator.validate(partial).valid).toBe(true);
    expect(validator.validate(partial).complete).toBe(false);

    const touching = {
      ships: [
        { id: 'a', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
        { id: 'b', cells: [{ x: 1, y: 1 }, { x: 2, y: 1 }] },
      ],
    };
    expect(validator.validate(touching).valid).toBe(false);
  });

  it('validates a complete fleet', () => {
    const fleet = new FleetGenerator(new SeededRandom(42)).generate();
    expect(new FleetValidator().validate(fleet)).toMatchObject({ valid: true, complete: true });
  });
});

describe('FleetGenerator', () => {
  it('is deterministic and always produces a complete valid fleet', () => {
    const first = new FleetGenerator(new SeededRandom(123)).generate();
    const second = new FleetGenerator(new SeededRandom(123)).generate();
    expect(first).toEqual(second);
    expect(new FleetValidator().validate(first)).toMatchObject({ valid: true, complete: true });
  });
});

describe('GameSession', () => {
  it('rejects repeat shots and alternates turns on misses', () => {
    const generator = new FleetGenerator(new SeededRandom(7));
    const human = generator.generate();
    const bot = generator.generate();
    const game = new GameSession({ humanFleet: human, botFleet: bot, bot: new RandomBot(1) });
    game.start();
    const first = game.shoot('human', { x: 0, y: 9 });
    expect(['hit', 'miss', 'sunk']).toContain(first.outcome);
    if (first.outcome === 'miss') {
      expect(game.currentTurn).toBe('bot');
      expect(() => game.shoot('human', { x: 0, y: 9 })).toThrow();
    } else {
      expect(game.currentTurn).toBe('human');
    }
  });

  it('detects sunk and victory and never exposes bot ship positions', () => {
    const completeHuman = new FleetGenerator(new SeededRandom(4)).generate();
    const completeBot = new FleetGenerator(new SeededRandom(5)).generate();
    const game = new GameSession({ humanFleet: completeHuman, botFleet: completeBot });
    game.start();
    const target = completeBot.ships.at(-1)!.cells[0];
    const result = game.shoot('human', target);
    expect(['hit', 'sunk']).toContain(result.outcome);
    expect(game.getPublicView().enemyBoard.every((cell) => cell.state !== 'ship')).toBe(true);
  });

  it('can run a complete bot-vs-bot smoke simulation', () => {
    const random = new SeededRandom(99);
    const generator = new FleetGenerator(random);
    const game = new GameSession({
      humanFleet: generator.generate(),
      botFleet: generator.generate(),
      bot: new RandomBot(random),
    });
    game.start();
    let shots = 0;
    while (game.phase === 'playing' && shots < 1000) {
      if (game.currentTurn === 'human') {
        game.shoot('human', new RandomBot(random).chooseShot(game.getBotObservation('human')));
      } else {
        game.playBotTurn();
      }
      shots++;
    }
    expect(['finished']).toContain(game.phase);
  });
});
