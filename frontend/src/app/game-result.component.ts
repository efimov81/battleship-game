import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import type { PublicGameView } from '@battleship/contracts';
import { LocalizationService } from './localization/localization.service';

@Component({
  selector: 'app-game-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-result.component.html',
})
export class GameResultComponent {
  protected readonly locale = inject(LocalizationService);

  readonly game = input.required<PublicGameView>();
  readonly botLabel = input.required<string>();
  readonly canRestart = input.required<boolean>();
  readonly restart = output<void>();

  protected readonly stats = computed(() => {
    const t = this.locale.messages();
    const { history, enemyFleetStatus } = this.game();
    const shots = history.filter((record) => record.shooter === 'human');
    const misses = shots.filter((record) => record.outcome === 'miss').length;
    const hits = shots.length - misses;
    const accuracy = shots.length ? hits / shots.length : 0;

    return [
      { label: t.shots, value: shots.length },
      { label: t.hits, value: hits },
      { label: t.misses, value: misses },
      { label: t.accuracy, value: this.locale.percent(accuracy) },
      { label: t.shipsSunk, value: enemyFleetStatus.filter((ship) => ship.sunk).length },
    ];
  });
}
