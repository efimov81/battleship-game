import { app } from './app.js';

await app.listen({ host: '127.0.0.1', port: Number(process.env.PORT ?? 3000) });
