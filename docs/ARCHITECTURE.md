# Architecture decisions

Goal: playable human-vs-bot Battleship first; then experiment with bot intelligence.

- `backend`: Fastify HTTP adapter, in-memory session repository, bot orchestration.
- `frontend`: Angular, two 10x10 grids, randomize/start/shoot/restart controls.
- `simulation` (to be added in Stage 2): invokes the **same** core GameSession as HTTP.

Security boundary: a bot gets only `BotObservation` copied from visible shot records. It must not receive a reference to private game state. HTTP responses must never include unsunk enemy fleet coordinates. Diagnostics can expose score maps but not hidden positions.

State transitions: `setup -> playing -> finished`. Human fleet can be randomized repeatedly in setup; bot fleet generated internally; start validates both fleets; turn alternates on miss, continues on hit/sunk. Game ends after all enemy ship cells have been hit. Invalid shots must not mutate state.

No persistence, multiplayer, drag/drop, ship movement, WebSockets, DI container or neural network in MVP.
