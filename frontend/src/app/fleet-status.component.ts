import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { PublicShipStatus } from '@battleship/contracts';

@Component({
  selector: 'app-fleet-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fleet-status.component.html',
})
export class FleetStatusComponent {
  readonly ships = input.required<readonly PublicShipStatus[]>();

  protected readonly sunkCount = computed(() => this.ships().filter(ship => ship.sunk).length);
}
