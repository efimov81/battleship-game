# Bot contract and evaluation

`BotStrategy.chooseShot(observation)` returns a legal coordinate. Observation includes rules, previous **own** shots with outcomes, remaining enemy ship sizes. It does not include opponent ships, opponent board internals, or a full GameSession.

The engine is authoritative: reject out-of-bounds and duplicate shots even if the bot malfunctions. Do not leak opponent placement in API, logs sent to UI, or debug score maps.

Stage 1: RandomBot chooses uniformly among unshot cells.
Stage 2: create repeatable benchmark and diagnostic positions. Use same GameSession engine as UI. Report average/median/p95 shots to sink fleet, and compute time. Avoid comparing only win rate because first-player advantage and extra turns distort results.
Stage 3: ProbabilityBot enumerates ship placements consistent with misses/hits/sunk ships, scores legal cells, explains choices. Placement frequency is a heuristic, not a true posterior over full fleets. Compare against RandomBot and a simple Hunt/Target baseline. Tests must include clustered hits, edge cases, sunk ships and no legal moves.
