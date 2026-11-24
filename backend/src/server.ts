import Fastify from 'fastify';
import cors from '@fastify/cors';
/** Deliberate scaffold: game endpoints are NOT implemented yet. */
const app = Fastify({ logger: true });
await app.register(cors, { origin: 'http://localhost:4200' });
app.get('/health', async () => ({ ok: true, status: 'scaffold' }));
app.get('/bots', async () => [{ id: 'random', label: 'Random (pending)' }, { id: 'probability', label: 'Probability (future)' }]);
app.setNotFoundHandler((_request, reply) => reply.code(501).send({ error: 'NOT_IMPLEMENTED', message: 'Game API is a Stage 1 task; see docs/API.md' }));
await app.listen({ host: '127.0.0.1', port: Number(process.env.PORT ?? 3000) });
