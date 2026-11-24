import { bootstrapApplication } from '@angular/platform-browser';
import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';

interface Coordinate { x: number; y: number }
interface PublicCell extends Coordinate { state: 'empty' | 'ship' | 'hit' | 'miss' | 'sunk' }
interface PublicGameView {
  id: string;
  phase: 'setup' | 'playing' | 'finished';
  currentTurn: 'human' | 'bot';
  ownBoard: PublicCell[];
  enemyBoard: PublicCell[];
  winner: 'human' | 'bot' | null;
  history: unknown[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
<main>
  <h1>Battleship Lab</h1>
  <div class="controls">
    <button (click)="newGame()" [disabled]="loading">New Game</button>
    <button (click)="randomize()" [disabled]="loading || !game || game.phase !== 'setup'">Randomize</button>
    <button (click)="start()" [disabled]="loading || !game || game.phase !== 'setup'">Start</button>
  </div>
  @if (message) { <p class="message">{{ message }}</p> }
  @if (game) {
    <p class="status">
      @if (game.phase === 'setup') { Place your fleet, then start }
      @if (game.phase === 'playing') { {{ game.currentTurn === 'human' ? 'Ваш ход' : 'Ход бота...' }} }
      @if (game.phase === 'finished') { {{ game.winner === 'human' ? 'Вы победили!' : 'Победил RandomBot' }} }
    </p>
    <div class="boards">
      <section>
        <h2>Ваше поле</h2>
        <div class="board">
          @for (cell of game.ownBoard; track $index) {
            <div class="cell" [class]="cell.state" [title]="cell.x + ',' + cell.y"></div>
          }
        </div>
      </section>
      <section>
        <h2>Поле противника</h2>
        <div class="board">
          @for (cell of game.enemyBoard; track $index) {
            <button
              class="cell enemy"
              [class]="cell.state"
              [disabled]="loading || game.phase !== 'playing' || game.currentTurn !== 'human' || cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk'"
              (click)="shoot(cell)"
              [title]="cell.x + ',' + cell.y"></button>
          }
        </div>
      </section>
    </div>
  }
</main>`,
})
class AppComponent implements OnInit {
  private http = inject(HttpClient);
  readonly api = 'http://localhost:3000';
  game: PublicGameView | null = null;
  loading = false;
  message = '';

  ngOnInit(): void {
    this.newGame();
  }

  newGame(): void {
    this.loading = true;
    this.message = '';
    this.http.post<PublicGameView>(`${this.api}/games`, { botId: 'random' }).subscribe({
      next: (game) => { this.game = game; this.loading = false; },
      error: () => this.failed('Не удалось создать игру'),
    });
  }

  randomize(): void {
    if (!this.game) return;
    this.loading = true;
    this.http.post<PublicGameView>(`${this.api}/games/${this.game.id}/fleet/random`, {}).subscribe({
      next: (game) => { this.game = game; this.loading = false; },
      error: () => this.failed('Не удалось расставить флот'),
    });
  }

  start(): void {
    if (!this.game) return;
    this.loading = true;
    this.http.post<PublicGameView>(`${this.api}/games/${this.game.id}/start`, {}).subscribe({
      next: (game) => { this.game = game; this.loading = false; },
      error: (error) => this.failed(error.error?.message ?? 'Не удалось начать игру'),
    });
  }

  shoot(cell: PublicCell): void {
    if (!this.game || this.loading) return;
    this.loading = true;
    this.http.post<{ view: PublicGameView }>(`${this.api}/games/${this.game.id}/shots`, {
      coordinate: { x: cell.x, y: cell.y },
    }).subscribe({
      next: (result) => { this.game = result.view; this.loading = false; },
      error: (error) => this.failed(error.error?.message ?? 'Выстрел отклонён'),
    });
  }

  private failed(message: string): void {
    this.loading = false;
    this.message = message;
  }
}

bootstrapApplication(AppComponent, { providers: [provideHttpClient()] }).catch(console.error);
