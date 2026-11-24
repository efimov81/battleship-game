import { afterAll, expect, it } from 'vitest';
import { app } from './app.js';

afterAll(() => app.close());

it('lists three difficulties and rejects an unknown one', async () => {
  expect((await app.inject('/bots')).json().map(({ id }: { id: string }) => id))
    .toEqual(['random', 'medium', 'hard']);
  const result = await app.inject({ method: 'POST', url: '/games', payload: { botId: 'unknown' } });
  expect(result.statusCode).toBe(400);
});

it('executes and records one delayed-mode shot for each history revision', async () => {
  const post = (url: string, payload = {}) => app.inject({ method: 'POST', url, payload });
  const created = await post('/games', { botId: 'hard' });
  expect(created.statusCode).toBe(201);
  const base = '/games/' + created.json().id;
  expect((await post(base + '/fleet/random')).statusCode).toBe(200);
  let view = (await post(base + '/start')).json();

  for (let i = 0; i < 100 && view.currentTurn === 'human'; i++) {
    const response = await post(base + '/shots', {
      coordinate: { x: i % 10, y: Math.floor(i / 10) },
      stepBot: true,
    });
    expect(response.statusCode).toBe(200);
    const result = response.json();
    expect(result.botShots).toEqual([]);
    view = result.view;
  }

  const payload = { expectedHistoryLength: view.history.length };
  const [first, repeated] = await Promise.all([post(base + '/bot-shot', payload), post(base + '/bot-shot', payload)]);
  expect([first.statusCode, repeated.statusCode].sort()).toEqual([200, 409]);
  const result = (first.statusCode === 200 ? first : repeated).json();
  expect(result.shot.shooter).toBe('bot');
  expect(result.view.history).toHaveLength(payload.expectedHistoryLength + 1);
});
