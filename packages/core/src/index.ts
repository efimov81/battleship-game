import type {
  BotObservation,
  Coordinate,
  Fleet,
  GamePhase,
  PlayerId,
  PublicGameView,
  PublicCell,
  ShotOutcome,
  ShotRecord,
  Ship,
} from '@battleship/contracts';

export type {
  BotObservation,
  Coordinate,
  Fleet,
  GamePhase,
  PlayerId,
  PublicGameView,
  PublicCell,
  ShotOutcome,
  ShotRecord,
  Ship,
} from '@battleship/contracts';

export const BOARD_SIZE = 10;
export const FLEET_SIZES = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1] as const;

export interface RandomSource {
  nextInt(maxExclusive: number): number;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed = 1) {
    this.state = seed >>> 0 || 0x6d2b79f5;
  }

  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError('maxExclusive must be a positive integer');
    }
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return Math.floor((this.state / 0x100000000) * maxExclusive);
  }
}

export interface FleetValidationResult {
  valid: boolean;
  complete: boolean;
  errors: string[];
}

export class FleetValidator {
  validate(fleet: Fleet): FleetValidationResult {
    const errors: string[] = [];
    if (!fleet || !Array.isArray(fleet.ships)) {
      return { valid: false, complete: false, errors: ['Fleet must contain a ships array'] };
    }

    const occupied = new Set<string>();
    const ids = new Set<string>();
    const sizes: number[] = [];

    for (const ship of fleet.ships) {
      if (!ship || typeof ship.id !== 'string' || !ship.id || ids.has(ship.id)) {
        errors.push('Ship IDs must be unique and non-empty');
      } else {
        ids.add(ship.id);
      }
      if (!Array.isArray(ship?.cells) || ship.cells.length === 0) {
        errors.push('Every ship must contain coordinates');
        continue;
      }

      const xs = ship.cells.map((cell) => cell?.x);
      const ys = ship.cells.map((cell) => cell?.y);
      if (xs.some((x) => !Number.isInteger(x) || x! < 0 || x! >= BOARD_SIZE)
        || ys.some((y) => !Number.isInteger(y) || y! < 0 || y! >= BOARD_SIZE)) {
        errors.push('Ship coordinate is outside the board');
      }

      const sameX = xs.every((x) => x === xs[0]);
      const sameY = ys.every((y) => y === ys[0]);
      if (!sameX && !sameY) {
        errors.push('A ship must be straight');
      }

      const ordered = sameX
        ? [...ys].sort((a, b) => a! - b!)
        : [...xs].sort((a, b) => a! - b!);
      if (sameX && ordered.some((value, index) => index > 0 && value !== ordered[index - 1]! + 1)) {
        errors.push('A ship must contain consecutive coordinates');
      }
      if (sameY && ordered.some((value, index) => index > 0 && value !== ordered[index - 1]! + 1)) {
        errors.push('A ship must contain consecutive coordinates');
      }

      const shipKeys = new Set<string>();
      for (const cell of ship.cells) {
        if (!cell || !Number.isInteger(cell.x) || !Number.isInteger(cell.y)) continue;
        const key = `${cell.x},${cell.y}`;
        if (occupied.has(key) || shipKeys.has(key)) errors.push('Ships may not overlap');
        shipKeys.add(key);
      }
      for (const key of shipKeys) occupied.add(key);
      sizes.push(ship.cells.length);
    }

    for (const ship of fleet.ships) {
      if (!Array.isArray(ship?.cells)) continue;
      for (const cell of ship.cells) {
        if (!cell) continue;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const neighbor = `${cell.x + dx},${cell.y + dy}`;
            if (occupied.has(neighbor) && !ship.cells.some((item) => item && `${item.x},${item.y}` === neighbor)) {
              const touchingWithinOtherShip = fleet.ships.some((other) =>
                other !== ship && Array.isArray(other?.cells)
                  && other.cells.some((item) => item && `${item.x},${item.y}` === neighbor),
              );
              if (touchingWithinOtherShip) errors.push('Ships may not touch');
            }
          }
        }
      }
    }

    const sortedSizes = [...sizes].sort((a, b) => b - a);
    const expected = [...FLEET_SIZES].sort((a, b) => b - a);
    const complete = sortedSizes.length === expected.length
      && sortedSizes.every((size, index) => size === expected[index]);

    return { valid: errors.length === 0, complete, errors };
  }

  isValid(fleet: Fleet): boolean {
    return this.validate(fleet).valid;
  }

  isComplete(fleet: Fleet): boolean {
    return this.validate(fleet).complete;
  }

  validateFleet(fleet: Fleet): FleetValidationResult {
    return this.validate(fleet);
  }
}

export class FleetGenerator {
  constructor(random: RandomSource | number = new SeededRandom()) {
    this.random = typeof random === 'number' ? new SeededRandom(random) : random;
  }

  private random: RandomSource;

  generate(random: RandomSource = this.random): Fleet {
    const ships: Ship[] = [];
    const occupied = new Set<string>();

    for (let index = 0; index < FLEET_SIZES.length; index++) {
      const size = FLEET_SIZES[index];
      let placed = false;
      for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
        const horizontal = random.nextInt(2) === 0;
        const startX = random.nextInt(horizontal ? BOARD_SIZE - size + 1 : BOARD_SIZE);
        const startY = random.nextInt(horizontal ? BOARD_SIZE : BOARD_SIZE - size + 1);
        const cells: Coordinate[] = Array.from({ length: size }, (_, offset) =>
          ({ x: startX + (horizontal ? offset : 0), y: startY + (horizontal ? 0 : offset) }),
        );
        const keys = cells.map((cell) => `${cell.x},${cell.y}`);
        const canPlace = keys.every((key) => {
          if (occupied.has(key)) return false;
          const [x, y] = key.split(',').map(Number);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (occupied.has(`${x + dx},${y + dy}`)) return false;
            }
          }
          return true;
        });
        if (canPlace) {
          ships.push({ id: `ship-${index + 1}`, cells });
          keys.forEach((key) => occupied.add(key));
          placed = true;
        }
      }
      if (!placed) throw new Error('Unable to generate a valid fleet');
    }

    return { ships };
  }
}

export class GameError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'GameError';
  }
}

export interface ShotResult {
  coordinate: Coordinate;
  shooter: PlayerId;
  outcome: ShotOutcome;
  sunkShipSize?: number;
  sunkShipId?: string;
  sunkShipCells?: Coordinate[];
  gameEnded: boolean;
  winner: PlayerId | null;
  currentTurn: PlayerId;
}

export interface GameSessionOptions {
  id?: string;
  humanFleet?: Fleet | null;
  botFleet?: Fleet | null;
  randomSource?: RandomSource;
  bot?: BotStrategy;
  initialTurn?: PlayerId;
}

export interface BotStrategy {
  chooseShot(observation: BotObservation): Coordinate;
}

export class RandomBot implements BotStrategy {
  constructor(random: RandomSource | number = new SeededRandom()) {
    this.random = typeof random === 'number' ? new SeededRandom(random) : random;
  }

  private random: RandomSource;

  chooseShot(observation: BotObservation): Coordinate {
    const unshot = new Set(observation.ownShots.map((shot) => `${shot.coordinate.x},${shot.coordinate.y}`));
    const available: Coordinate[] = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (!unshot.has(`${x},${y}`)) available.push({ x, y });
      }
    }
    if (available.length === 0) throw new GameError('NO_LEGAL_MOVES', 'No legal bot shots remain');
    return available[this.random.nextInt(available.length)];
  }
}

export class GameSession {
  readonly id: string;
  private humanFleet: Fleet | null;
  private botFleet: Fleet | null;
  private bot: BotStrategy;
  phase: GamePhase = 'setup';
  currentTurn: PlayerId;
  winner: PlayerId | null = null;
  readonly history: ShotRecord[] = [];
  private humanHits = new Set<string>();
  private botHits = new Set<string>();
  private sunkHumanShips = new Set<string>();
  private sunkBotShips = new Set<string>();

  constructor(options: GameSessionOptions | string | Fleet = {}, botFleet?: Fleet) {
    const normalized: GameSessionOptions = typeof options === 'string'
      ? { id: options }
      : 'ships' in options
        ? { humanFleet: options, botFleet }
        : options;
    this.id = normalized.id ?? `game-${Math.random().toString(36).slice(2, 10)}`;
    this.humanFleet = normalized.humanFleet ?? null;
    this.botFleet = normalized.botFleet ?? null;
    this.bot = normalized.bot ?? new RandomBot(normalized.randomSource);
    this.currentTurn = normalized.initialTurn ?? 'human';
  }

  setHumanFleet(fleet: Fleet): void {
    if (this.phase !== 'setup') throw new GameError('WRONG_PHASE', 'Fleet changes are only allowed in setup');
    this.humanFleet = fleet;
  }

  setBotFleet(fleet: Fleet): void {
    if (this.phase !== 'setup') throw new GameError('WRONG_PHASE', 'Fleet changes are only allowed in setup');
    this.botFleet = fleet;
  }

  start(): PublicGameView {
    if (this.phase !== 'setup') throw new GameError('WRONG_PHASE', 'Game can only start from setup');
    const validator = new FleetValidator();
    const human = this.humanFleet && validator.validate(this.humanFleet);
    const bot = this.botFleet && validator.validate(this.botFleet);
    if (!human?.complete || !human.valid) {
      throw new GameError('INVALID_FLEET', 'Human fleet is incomplete or invalid');
    }
    if (!bot?.complete || !bot.valid) {
      throw new GameError('INVALID_FLEET', 'Bot fleet is incomplete or invalid');
    }
    this.phase = 'playing';
    return this.getPublicView();
  }

  shoot(shooter: PlayerId | Coordinate, coordinate?: Coordinate): ShotResult {
    if (coordinate === undefined) {
      coordinate = shooter as Coordinate;
      shooter = 'human';
    }
    if (this.phase !== 'playing') throw new GameError('WRONG_PHASE', 'Game is not in playing phase');
    if (shooter !== this.currentTurn) throw new GameError('WRONG_TURN', `It is ${this.currentTurn}'s turn`);
    if (!coordinate || !Number.isInteger(coordinate.x) || !Number.isInteger(coordinate.y)
      || coordinate.x < 0 || coordinate.x >= BOARD_SIZE || coordinate.y < 0 || coordinate.y >= BOARD_SIZE) {
      throw new GameError('BAD_COORDINATE', 'Coordinate is outside the board');
    }
    const targetFleet = shooter === 'human' ? this.botFleet : this.humanFleet;
    const shooterHits = shooter === 'human' ? this.humanHits : this.botHits;
    const key = `${coordinate.x},${coordinate.y}`;
    if ([...shooterHits, ...this.history.filter((record) => record.shooter === shooter).map((record) => `${record.coordinate.x},${record.coordinate.y}`)]
      .includes(key)) {
      throw new GameError('REPEAT_SHOT', 'This coordinate was already shot');
    }

    const ship = targetFleet?.ships.find((item) => item.cells.some((cell) => cell.x === coordinate.x && cell.y === coordinate.y));
    let outcome: ShotOutcome = ship ? 'hit' : 'miss';
    let sunkShipSize: number | undefined;
    let sunkShipId: string | undefined;
    if (ship) {
      shooterHits.add(key);
      const allHit = ship.cells.every((cell) => shooterHits.has(`${cell.x},${cell.y}`));
      if (allHit) {
        outcome = 'sunk';
        sunkShipSize = ship.cells.length;
        sunkShipId = ship.id;
        if (shooter === 'human') this.sunkBotShips.add(ship.id);
        else this.sunkHumanShips.add(ship.id);
      }
    }

    const record: ShotRecord = {
      coordinate: { ...coordinate },
      shooter,
      outcome,
      ...(sunkShipSize !== undefined ? { sunkShipSize, sunkShipId, sunkShipCells: ship?.cells.map((cell) => ({ ...cell })) } : {}),
    };
    this.history.push(record);

    const allSunk = targetFleet?.ships.every((item) =>
      item.cells.every((cell) => shooterHits.has(`${cell.x},${cell.y}`)),
    ) ?? false;
    if (allSunk) {
      this.phase = 'finished';
      this.winner = shooter;
      this.currentTurn = shooter;
    } else if (outcome === 'miss') {
      this.currentTurn = shooter === 'human' ? 'bot' : 'human';
    }

    return {
      coordinate: { ...coordinate },
      shooter,
      outcome,
      ...(sunkShipSize !== undefined ? { sunkShipSize, sunkShipId, sunkShipCells: ship?.cells.map((cell) => ({ ...cell })) } : {}),
      gameEnded: this.phase === 'finished',
      winner: this.winner,
      currentTurn: this.currentTurn,
    };
  }

  fireShot(coordinate: Coordinate, shooter: PlayerId = 'human'): ShotResult {
    return this.shoot(shooter, coordinate);
  }

  takeShot(coordinate: Coordinate, shooter: PlayerId = 'human'): ShotResult {
    return this.shoot(shooter, coordinate);
  }

  getBotObservation(player: 'human' | 'bot' = 'bot'): BotObservation {
    const ownShots = this.history.filter((record) => record.shooter === player);
    const remainingEnemyShipSizes: number[] = [...FLEET_SIZES];
    for (const shot of ownShots) {
      const index = remainingEnemyShipSizes.indexOf(shot.sunkShipSize ?? 0);
      if (shot.outcome === 'sunk' && index >= 0) remainingEnemyShipSizes.splice(index, 1);
    }
    return {
      rules: { boardSize: BOARD_SIZE, fleetSizes: [...FLEET_SIZES] },
      ownShots: ownShots.map((record) => ({ ...record, coordinate: { ...record.coordinate }, ...(record.sunkShipCells && { sunkShipCells: record.sunkShipCells.map((cell) => ({ ...cell })) }) })),
      remainingEnemyShipSizes,
    };
  }

  getObservation(player: 'human' | 'bot' = 'bot'): BotObservation {
    return this.getBotObservation(player);
  }

  playBotShot(): ShotResult | null {
    if (this.phase !== 'playing' || this.currentTurn !== 'bot') return null;
    return this.shoot('bot', this.bot.chooseShot(this.getBotObservation()));
  }

  playBotTurn(): ShotResult[] {
    if (this.phase !== 'playing' || this.currentTurn !== 'bot') return [];
    const results: ShotResult[] = [];
    while (this.phase === 'playing' && this.currentTurn === 'bot') {
      const shot = this.playBotShot();
      if (shot) results.push(shot);
    }
    return results;
  }

  getPublicView(): PublicGameView {
    const ownBoard = this.buildPublicBoard(this.humanFleet, 'human');
    const enemyBoard = this.buildPublicBoard(this.botFleet, 'bot');
    return {
      id: this.id,
      phase: this.phase,
      currentTurn: this.currentTurn,
      humanFleet: this.humanFleet ? this.cloneFleet(this.humanFleet) : null,
      ownBoard,
      enemyBoard,
      winner: this.winner,
      history: this.history.map((record) => ({ ...record, coordinate: { ...record.coordinate }, ...(record.sunkShipCells && { sunkShipCells: record.sunkShipCells.map((cell) => ({ ...cell })) }) })),
    };
  }

  private buildPublicBoard(fleet: Fleet | null, owner: PlayerId): PublicCell[] {
    const hitSet = owner === 'human' ? this.botHits : this.humanHits;
    const sunkIds = owner === 'human' ? this.sunkHumanShips : this.sunkBotShips;
    const missSet = new Set(
      this.history
        .filter((record) => record.outcome === 'miss'
          && record.shooter === (owner === 'human' ? 'bot' : 'human'))
        .map((record) => `${record.coordinate.x},${record.coordinate.y}`),
    );
    const result: PublicCell[] = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const key = `${x},${y}`;
        const ship = fleet?.ships.find((item) => item.cells.some((cell) => cell.x === x && cell.y === y));
        const sunk = ship ? sunkIds.has(ship.id) : false;
        let state: PublicCell['state'] = 'empty';
        if (owner === 'human' && ship) state = 'ship';
        if (hitSet.has(key)) state = sunk ? 'sunk' : 'hit';
        else if (missSet.has(key)) state = 'miss';
        result.push({ x, y, state });
      }
    }
    return result;
  }

  private cloneFleet(fleet: Fleet): Fleet {
    return { ships: fleet.ships.map((ship) => ({
      id: ship.id,
      cells: ship.cells.map((cell) => ({ ...cell })),
    })) };
  }
}

export class GameFactory {
  constructor(private random: RandomSource = new SeededRandom()) {}

  create(options: GameSessionOptions = {}): GameSession {
    const botFleet = options.botFleet ?? new FleetGenerator(this.random).generate();
    return new GameSession({ ...options, botFleet, randomSource: options.randomSource ?? this.random });
  }

  createGame(options: GameSessionOptions = {}): GameSession {
    return this.create(options);
  }
}

export class InMemoryGameRepository {
  private games = new Map<string, GameSession>();

  save(game: GameSession): void {
    this.games.set(game.id, game);
  }

  get(id: string): GameSession | undefined {
    return this.games.get(id);
  }

  find(id: string): GameSession | undefined {
    return this.get(id);
  }

  delete(id: string): void {
    this.games.delete(id);
  }
}
