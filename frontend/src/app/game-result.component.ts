import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { PublicGameView } from '@battleship/contracts';

@Component({
  selector: 'app-game-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-result.component.html',
})
export class GameResultComponent {
  readonly game = input.required<PublicGameView>();
  readonly botLabel = input.required<string>();
  readonly canRestart = input.required<boolean>();
  readonly restart = output<void>();

  protected readonly stats = computed(() => {
    const { history, enemyFleetStatus } = this.game();
    const shots = history.filter((record) => record.shooter === 'human');
    const misses = shots.filter((record) => record.outcome === 'miss').length;
    const hits = shots.length - misses;
    const accuracy = shots.length ? Math.round(100 * hits / shots.length) : 0;

    return [
      { label: 'Ваши выстрелы', value: shots.length },
      { label: 'Попадания', value: hits },
      { label: 'Промахи', value: misses },
      { label: 'Точность', value: `${accuracy}%` },
      { label: 'Потоплено кораблей противника', value: enemyFleetStatus.filter((ship) => ship.sunk).length },
    ];
  });
}
