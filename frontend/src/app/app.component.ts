import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';

import type { Coordinate, PublicGameView, ShotRecord } from '@battleship/contracts';
import { BattleBoardComponent } from './battle-board.component';
import { FleetStatusComponent } from './fleet-status.component';
import { GameControlsComponent, type BotOption } from './game-controls.component';
import { GameResultComponent } from './game-result.component';
import { LocalizationService } from './localization/localization.service';
import { botLabel, errorMessageKey, type MessageKey } from './localization/messages';

@Component({
  selector: 'app-root',
  imports: [BattleBoardComponent, FleetStatusComponent, GameControlsComponent, GameResultComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  protected readonly locale = inject(LocalizationService);

  private http = inject(HttpClient);
  private changeDetector = inject(ChangeDetectorRef);
  private botTimer?: ReturnType<typeof setTimeout>;
  private highlightTimer?: ReturnType<typeof setTimeout>;
  protected lastShot?: ShotRecord;
  private generation = 0;
  bots: BotOption[] = [];
  selectedBotId = 'random';
  activeBotId = '';
  protected readonly botLabel = botLabel;
  readonly api = 'http://localhost:3000';
  game: PublicGameView | null = null;
  loading = false;
  message: MessageKey | null = null;

  ngOnInit(): void {
    this.http.get<BotOption[]>(`${this.api}/bots`).subscribe({
      next: (bots) => { this.bots = bots; this.changeDetector.markForCheck(); },
      error: () => this.failed('loadBotsFailed'),
    });
  }

  newGame(): void {
    if (this.loading || !this.bots.length) return;
    this.cancelTimers();
    if (this.game?.phase !== 'finished') this.game = null;
    this.loading = true;
    this.message = null;
    const botId = this.selectedBotId;
    this.http.post<PublicGameView>(`${this.api}/games`, { botId }).subscribe({
      next: (game) => {
        this.activeBotId = botId;
        this.applyView(game);
      },
      error: (error) => this.failed('createFailed', error.error?.error),
    });
  }

  randomize(): void {
    if (!this.game) return;
    this.loading = true;
    this.http.post<PublicGameView>(`${this.api}/games/${this.game.id}/fleet/random`, {}).subscribe({
      next: (game) => this.applyView(game),
      error: (error) => this.failed('deployFailed', error.error?.error),
    });
  }

  start(): void {
    if (!this.game) return;
    this.loading = true;
    this.http.post<PublicGameView>(`${this.api}/games/${this.game.id}/start`, {}).subscribe({
      next: (game) => this.applyView(game),
      error: (error) => this.failed('startFailed', error.error?.error),
    });
  }

  shoot(cell: Coordinate): void {
    if (this.game?.phase !== 'playing' || this.game.currentTurn !== 'human' || this.loading) return;
    this.loading = true;
    this.message = null;
    this.http.post<{ view: PublicGameView; humanShot: ShotRecord }>(`${this.api}/games/${this.game.id}/shots`, {
      coordinate: { x: cell.x, y: cell.y },
      stepBot: true,
    }).subscribe({
      next: ({ view, humanShot }) => this.applyView(view, humanShot),
      error: (error) => this.failed('shotFailed', error.error?.error),
    });
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
          error: (error) => {
            if (generation === this.generation) this.failed('botShotFailed', error.error?.error);
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

  private failed(fallback: MessageKey, code?: unknown): void {
    this.loading = false;
    this.message = errorMessageKey(code, fallback);
    this.changeDetector.markForCheck();
  }
}
