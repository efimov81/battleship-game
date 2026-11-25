import { bootstrapApplication } from '@angular/platform-browser';
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';

import type { Coordinate, PublicCell, PublicGameView, ShotRecord } from '@battleship/contracts';

interface BotOption { id: string; label: string }

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
<main>
  <h1>Battleship Lab</h1>
  <div class="controls">
    <label>Сложность
      <select #difficulty [value]="selectedBotId" (change)="selectedBotId = difficulty.value">
        @for (bot of bots; track bot.id) {
          <option [value]="bot.id">{{ bot.label }}</option>
        }
      </select>
    </label>
    <button (click)="newGame()" [disabled]="loading || !bots.length">Новая игра</button>
    <button (click)="randomize()" [disabled]="loading || !game || game.phase !== 'setup'">Randomize</button>
    <button (click)="start()" [disabled]="loading || !game || game.phase !== 'setup'">Start</button>
  </div>
  @if (message) { <p class="message">{{ message }}</p> }
  @if (game) {
    <p class="status">
      {{ activeBotLabel }} ·
      @if (game.phase === 'setup') { Place your fleet, then start }
      @if (game.phase === 'playing') { {{ game.currentTurn === 'human' ? 'Ваш ход' : 'Ход бота...' }} }
      @if (game.phase === 'finished') { {{ game.winner === 'human' ? 'Вы победили!' : 'Победил бот' }} }
    </p>
    <div class="boards">
      <section>
        <h2>Ваше поле</h2>
        <div class="board">
          @for (cell of game.ownBoard; track $index) {
            <div class="cell" [class]="cell.state" [class.last-hit]="highlight(cell, 'bot', false)"
              [class.last-miss]="highlight(cell, 'bot', true)" [title]="cell.x + ',' + cell.y"></div>
          }
        </div>
      </section>
      <section>
        <h2>Поле противника</h2>
        <div class="enemy-layout">
          <div class="board">
            @for (cell of game.enemyBoard; track $index) {
              <button
                class="cell enemy"
                [class]="cell.state"
                [class.last-hit]="highlight(cell, 'human', false)"
                [class.last-miss]="highlight(cell, 'human', true)"
                [disabled]="loading || game.phase !== 'playing' || game.currentTurn !== 'human' || cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk'"
                (click)="shoot(cell)"
                [title]="cell.x + ',' + cell.y"></button>
            }
          </div>
          <div class="fleet-status">
            <h3>Флот противника</h3>
            <ul>
              @for (ship of game.enemyFleetStatus; track $index) {
                <li class="fleet-ship" [class.sunk]="ship.sunk">
                  <span class="visually-hidden">{{ ship.size }} кл. — {{ ship.sunk ? 'потоплен' : 'на плаву' }}</span>
                  <span class="fleet-strip" [style.--ship-size]="ship.size" aria-hidden="true"></span>
                </li>
              }
            </ul>
          </div>
        </div>
      </section>
    </div>
  }
</main>`,
})
class AppComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private changeDetector = inject(ChangeDetectorRef);
  private botTimer?: ReturnType<typeof setTimeout>;
  private highlightTimer?: ReturnType<typeof setTimeout>;
  private lastShot?: ShotRecord;
  private generation = 0;
  bots: BotOption[] = [];
  selectedBotId = 'random';
  activeBotLabel = '';
  readonly api = 'http://localhost:3000';
  game: PublicGameView | null = null;
  loading = false;
  message = '';

  ngOnInit(): void {
    this.http.get<BotOption[]>(`${this.api}/bots`).subscribe({
      next: (bots) => { this.bots = bots; this.changeDetector.markForCheck(); },
      error: () => this.failed('Не удалось загрузить уровни сложности'),
    });
  }

  newGame(): void {
    if (this.loading || !this.bots.length) return;
    this.cancelTimers();
    this.game = null;
    this.loading = true;
    this.message = '';
    const botId = this.selectedBotId;
    this.http.post<PublicGameView>(`${this.api}/games`, { botId }).subscribe({
      next: (game) => {
        this.activeBotLabel = this.bots.find((bot) => bot.id === botId)?.label ?? botId;
        this.applyView(game);
      },
      error: () => this.failed('Не удалось создать игру'),
    });
  }

  randomize(): void {
    if (!this.game) return;
    this.loading = true;
    this.http.post<PublicGameView>(`${this.api}/games/${this.game.id}/fleet/random`, {}).subscribe({
      next: (game) => this.applyView(game),
      error: () => this.failed('Не удалось расставить флот'),
    });
  }

  start(): void {
    if (!this.game) return;
    this.loading = true;
    this.http.post<PublicGameView>(`${this.api}/games/${this.game.id}/start`, {}).subscribe({
      next: (game) => this.applyView(game),
      error: (error) => this.failed(error.error?.message ?? 'Не удалось начать игру'),
    });
  }

  shoot(cell: PublicCell): void {
    if (this.game?.phase !== 'playing' || this.game.currentTurn !== 'human' || this.loading) return;
    this.loading = true;
    this.message = '';
    this.http.post<{ view: PublicGameView; humanShot: ShotRecord }>(`${this.api}/games/${this.game.id}/shots`, {
      coordinate: { x: cell.x, y: cell.y },
      stepBot: true,
    }).subscribe({
      next: ({ view, humanShot }) => this.applyView(view, humanShot),
      error: (error) => this.failed(error.error?.message ?? 'Выстрел отклонён'),
    });
  }

  highlight(cell: Coordinate, shooter: ShotRecord['shooter'], miss: boolean): boolean {
    const shot = this.lastShot;
    return !!shot && shot.shooter === shooter && (shot.outcome === 'miss') === miss
      && shot.coordinate.x === cell.x && shot.coordinate.y === cell.y;
  }

  ngOnDestroy(): void {
    this.cancelTimers();
  }

  private applyView(view: PublicGameView, shot?: ShotRecord): void {
    this.game = view;
    this.loading = false;
    if (shot) {
      clearTimeout(this.highlightTimer);
      this.lastShot = shot;
      this.highlightTimer = setTimeout(() => {
        this.lastShot = undefined;
        this.changeDetector.markForCheck();
      }, 3000);
    }

    clearTimeout(this.botTimer);
    if (view.phase === 'playing' && view.currentTurn === 'bot') {
      const generation = this.generation;
      this.botTimer = setTimeout(() => {
        this.http.post<{ view: PublicGameView; shot: ShotRecord }>(`${this.api}/games/${view.id}/bot-shot`, {
          expectedHistoryLength: view.history.length,
        }).subscribe({
          next: ({ view, shot }) => {
            if (generation === this.generation) this.applyView(view, shot);
          },
          error: () => {
            if (generation === this.generation) this.failed('Не удалось выполнить ход бота');
          },
        });
      }, 450);
    }
    this.changeDetector.markForCheck();
  }

  private cancelTimers(): void {
    this.generation++;
    clearTimeout(this.botTimer);
    clearTimeout(this.highlightTimer);
    this.lastShot = undefined;
  }

  private failed(message: string): void {
    this.loading = false;
    this.message = message;
    this.changeDetector.markForCheck();
  }
}

bootstrapApplication(AppComponent, { providers: [provideHttpClient()] }).catch(console.error);
