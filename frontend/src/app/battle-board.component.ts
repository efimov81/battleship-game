import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { Coordinate, PublicCell, ShotRecord } from '@battleship/contracts';

@Component({
  selector: 'app-battle-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './battle-board.component.html',
})
export class BattleBoardComponent {
  readonly cells = input.required<readonly PublicCell[]>();
  readonly enemy = input(false, { transform: booleanAttribute });
  readonly canShoot = input(false);
  readonly lastShot = input<ShotRecord>();
  readonly fire = output<Coordinate>();

  private readonly boardShot = computed(() => {
    const shot = this.lastShot();
    return shot?.shooter === (this.enemy() ? 'human' : 'bot') ? shot : undefined;
  });

  protected highlight(cell: Coordinate): 'hit' | 'miss' | null {
    const shot = this.boardShot();
    if (shot?.coordinate.x !== cell.x || shot.coordinate.y !== cell.y) return null;
    return shot.outcome === 'miss' ? 'miss' : 'hit';
  }
}
