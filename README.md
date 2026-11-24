# Battleship Lab — architecture starter

This is a **scaffold, not a playable game**. It contains TypeScript contracts, core interfaces, seeded RNG, minimal Fastify and Angular bootstraps, rules/API docs, and a Codex Stage 1 task. The gameplay, random fleet generator and bot are deliberately left for Codex.

## Prerequisites
Node.js 22+, npm 10+.

## Setup
```bash
npm install
npm run build
npm test
```

## Development (two terminals)
```bash
npm run dev:api
npm run dev:web
```
Open http://localhost:4200 and http://localhost:3000/health. Currently only empty boards and health/bot placeholders work.

## Next step
Open this folder in VS Code / Codex and provide `docs/CODEX_STAGE_1.md` as the task. Do not ask Codex to create another project.

## Structure
- `packages/contracts` — public types and bot API.
- `packages/core` — game engine interfaces and seeded random source.
- `backend` — Fastify starter.
- `frontend` — Angular starter.
- `docs` — rules, architecture, API and Codex instructions.
