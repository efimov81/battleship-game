import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  FleetGenerator,
  GameError,
  GameFactory,
  InMemoryGameRepository,
  RandomBot,
  SeededRandom,
} from '@battleship/core';
import type { Coordinate, Fleet } from '@battleship/contracts';

const app = Fastify({ logger: true });
await app.register(cors, {
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
});
const repository = new InMemoryGameRepository();
const random = new SeededRandom(Date.now());
const fleetGenerator = new FleetGenerator(random);
const factory = new GameFactory(random);

app.get('/health', async () => ({ ok: true, status: 'ready' }));
app.get('/bots', async () => [
  { id: 'random', label: 'Random' },
  { id: 'probability', label: 'Probability (future)' },
]);

app.post('/games', async (request, reply) => {
  const body = request.body as { botId?: string } | undefined;
  if (body?.botId && body.botId !== 'random') {
    return reply.code(400).send({ error: 'UNKNOWN_BOT', message: 'Only Random bot is available in Stage 1' });
  }
  const session = factory.create({
    bot: new RandomBot(random),
  });
  repository.save(session);
  return reply.code(201).send(session.getPublicView());
});

app.get<{ Params: { id: string } }>('/games/:id', async (request, reply) => {
  const session = repository.get(request.params.id);
  if (!session) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Game not found' });
  return session.getPublicView();
});

app.post<{ Params: { id: string } }>('/games/:id/fleet/random', async (request, reply) => {
  const session = repository.get(request.params.id);
  if (!session) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Game not found' });
  try {
    session.setHumanFleet(fleetGenerator.generate());
    return session.getPublicView();
  } catch (error) {
    return gameError(reply, error);
  }
});

app.put<{ Params: { id: string }; Body: { fleet: Fleet } }>('/games/:id/fleet', async (request, reply) => {
  const session = repository.get(request.params.id);
  if (!session) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Game not found' });
  try {
    if (!request.body?.fleet) throw new GameError('BAD_REQUEST', 'fleet is required');
    session.setHumanFleet(request.body.fleet);
    return session.getPublicView();
  } catch (error) {
    return gameError(reply, error);
  }
});

app.post<{ Params: { id: string } }>('/games/:id/start', async (request, reply) => {
  const session = repository.get(request.params.id);
  if (!session) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Game not found' });
  try {
    return session.start();
  } catch (error) {
    return gameError(reply, error);
  }
});

app.post<{ Params: { id: string }; Body: { coordinate: Coordinate } }>(
  '/games/:id/shots',
  async (request, reply) => {
    const session = repository.get(request.params.id);
    if (!session) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Game not found' });
    try {
      if (!request.body?.coordinate) throw new GameError('BAD_COORDINATE', 'coordinate is required');
      session.shoot('human', request.body.coordinate);
      const botShots = session.playBotTurn();
      return {
        view: session.getPublicView(),
        humanShot: session.history.at(-1 - botShots.length) ?? null,
        botShots,
      };
    } catch (error) {
      return gameError(reply, error);
    }
  },
);

app.get<{ Params: { id: string } }>('/games/:id/history', async (request, reply) => {
  const session = repository.get(request.params.id);
  if (!session) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Game not found' });
  return { history: session.history };
});

function gameError(reply: any, error: unknown) {
  if (error instanceof GameError) {
    const status = error.code === 'NOT_FOUND' ? 404
      : error.code === 'WRONG_PHASE' || error.code === 'WRONG_TURN' ? 409
      : 400;
    return reply.code(status).send({ error: error.code, message: error.message });
  }
  app.log.error(error);
  return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Unexpected server error' });
}

await app.listen({ host: '127.0.0.1', port: Number(process.env.PORT ?? 3000) });
