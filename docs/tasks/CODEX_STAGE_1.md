# Codex task: make the scaffold playable

You are working in a prepared monorepo. Read README and all docs first. **Do not recreate the project** or change public contracts without explaining a necessary reason.

Implement `FleetValidator`, `FleetGenerator`, `GameSession`, `GameFactory`, and `RandomBot`; create an in-memory game repository and wire planned endpoints in docs/API.md. Implement Angular UI with two boards, Randomize, Start, New Game, selectable Random bot, clickable enemy board, hit/miss/sunk indications, winner, disabled clicks when not human turn. No drag/drop/manual placement required. Generate bot fleet automatically and keep it hidden. No DB, Phaser, WebSockets, authentication or overengineered abstractions.

Use a deterministic random source for tests. Write unit tests for full/partial fleet validation, boundaries, no touching, seeded generation, shot processing, repeat-shot rejection, turns, sunk detection, victory, no hidden data in BotObservation and public API. Add an API integration test and a smoke test for a complete bot-vs-bot simulation using the same engine.

Acceptance: `npm install`, `npm run build`, `npm test` pass; `npm run dev:api` and `npm run dev:web` start; human can finish a game in browser against RandomBot. API does not leak hidden bot ships. Report any limitations and commands used. Stop after Stage 1: do not implement ProbabilityBot yet.
