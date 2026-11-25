# Battleship Lab

Battleship Lab is a browser-based Battleship game against a computer opponent. It uses Angular and Tailwind CSS for the interface, Fastify for the API, and a shared TypeScript game engine.

## How to play

1. Choose a difficulty (Beginner, Medium, or Hard) and select **New game**.
2. Select **Deploy fleet** to randomly place your ships, then select **Start battle**.
3. Fire by selecting a cell on the enemy board. Use the board legend to distinguish hits, misses, and sunk ships.
4. After a win or loss, review your shots, hits, misses, accuracy, and the number of enemy ships sunk. Select **New game** to play again.

The interface is available in **English (EN)** and **Russian (RU)**. English is the default. Use the language switcher in the header to change languages during a match. Your choice is saved in the browser for future visits.

## Screenshots

### Desktop

![Desktop match showing both boards, the enemy fleet, and the shot legend](docs/screenshots/game.png)

### Mobile

![Mobile match with the enemy board above the player’s board](docs/screenshots/mobile.png)

## Run locally

Use Node.js 22 (see [`.nvmrc`](.nvmrc)) and npm.

```bash
npm ci
npm run build
```

Start the API and web app in separate terminals.

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Open the [game](http://localhost:4200) in your browser. The API exposes a [health endpoint](http://localhost:3000/health).

Run `npm test` to check the game engine, API and bots, and frontend localization.

## Project structure

- `frontend` — Angular interface, Tailwind styles, and EN/RU translations.
- `backend` — Fastify API and bot strategies.
- `packages/core` — game rules, fleet generation, and game sessions.
- `packages/contracts` — shared TypeScript types for the API and game engine.

See the [game rules](docs/GAME_RULES.md), [API reference](docs/API.md), and [architecture overview](docs/ARCHITECTURE.md).
