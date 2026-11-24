# Classic rules (MVP)

Board: 10x10, coordinates x/y from 0 to 9. Fleet sizes `[4,3,3,2,2,2,1,1,1,1]` (20 occupied cells). Ships straight and fully in bounds, may not overlap or touch even diagonally. Hits and sunk ships are visible to the shooter. On hit/sunk shooter fires again; on miss turn passes. Repeated shots are rejected. Sunk ships are announced with size. Win: all opponent ship cells hit. Initial player: human in MVP (make configurable later). No movement.

Fleet validation: support both `valid` (placements obey rules) and `complete` (exact fleet composition) so UI can eventually allow partial setups. Randomizer must always generate complete fleets. Ship IDs unique within fleet. Coordinates integral.
