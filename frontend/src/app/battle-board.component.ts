import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import type { Coordinate, PublicCell, ShotRecord } from '@battleship/contracts';
import { LocalizationService } from './localization/localization.service';

@Component({
  selector: 'app-battle-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './battle-board.component.html',
})
export class BattleBoardComponent {
  protected readonly locale = inject(LocalizationService);

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
    return cell.state === 'empty' ? coordinate : `${coordinate}, ${this.locale.messages()[cell.state]}`;
  }

  protected highlight(cell: Coordinate): 'hit' | 'miss' | null {
    const shot = this.boardShot();
    if (shot?.coordinate.x !== cell.x || shot.coordinate.y !== cell.y) return null;
    return shot.outcome === 'miss' ? 'miss' : 'hit';
  }
}
