# Planned HTTP API (Stage 1, not implemented yet)

- `GET /health` — implemented.
- `GET /bots` — implemented, placeholder list.
- `POST /games` `{ "botId": "random" }` -> public game view with id, phase=setup.
- `GET /games/:id` -> public game view.
- `POST /games/:id/fleet/random` -> generate/replace human fleet in setup.
- `PUT /games/:id/fleet` `{ "fleet": { "ships": [...] } }` -> reserved for future manual placement; optional in Stage 1.
- `POST /games/:id/start` -> validate setup and begin.
- `POST /games/:id/shots` `{ "coordinate": { "x": 3, "y": 4 } }` -> human shot + bot reply chain until human turn or game end.
- `GET /games/:id/history` -> public turn history.

All responses must omit enemy ship positions until game is finished (prefer omit even then in MVP). Return appropriate 400/404/409 errors for bad coordinates, missing game, wrong phase or turn. Keep server-side game state in memory; no database. Keep HTTP routes thin and call GameSession.
