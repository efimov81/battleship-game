import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { Coordinate, PublicCell, ShotRecord } from '@battleship/contracts';

const CELL_LABELS: Record<PublicCell['state'], string> = {
  empty: '',
  ship: 'корабль',
  hit: 'попадание',
  miss: 'промах',
  sunk: 'потоплен',
};

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

  protected readonly columns = 'ABCDEFGHIJ'.split('');

  private readonly boardShot = computed(() => {
    const shot = this.lastShot();
    return shot?.shooter === (this.enemy() ? 'human' : 'bot') ? shot : undefined;
  });

  protected cellLabel(cell: PublicCell): string {
    const coordinate = this.columns[cell.x] + (cell.y + 1);
    const state = CELL_LABELS[cell.state];
    return state ? `${coordinate}, ${state}` : coordinate;
  }

  protected highlight(cell: Coordinate): 'hit' | 'miss' | null {
    const shot = this.boardShot();
    if (shot?.coordinate.x !== cell.x || shot.coordinate.y !== cell.y) return null;
    return shot.outcome === 'miss' ? 'miss' : 'hit';
  }
}
