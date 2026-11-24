import { RandomBot, type BotStrategy, type RandomSource } from '@battleship/core';
import type { BotObservation } from '@battleship/contracts';
import type { BotDecision } from './decision.js';
import { MediumBot } from './medium.bot.js';
import { HardBot } from './hard.bot.js';

export const bots = [
  { id: 'random', label: 'Начальный' },
  { id: 'medium', label: 'Средний' },
  { id: 'hard', label: 'Высокий' },
] as const;

export function createBot(id: unknown, random: RandomSource, log: (decision: BotDecision) => void): BotStrategy | undefined {
  let decide: (observation: BotObservation) => BotDecision;
  switch (id) {
    case 'random': {
      const bot = new RandomBot(random);
      decide = (observation) => ({ coordinate: bot.chooseShot(observation), mode: 'search', reason: 'Random unshot cell' });
      break;
    }
    case 'medium': {
      const bot = new MediumBot(random);
      decide = (observation) => bot.decide(observation);
      break;
    }
    case 'hard': {
      const bot = new HardBot();
      decide = (observation) => bot.decide(observation);
      break;
    }
    default: return undefined;
  }
  return { chooseShot(observation) {
    const decision = decide(observation);
    log(decision);
    return decision.coordinate;
  } };
}
