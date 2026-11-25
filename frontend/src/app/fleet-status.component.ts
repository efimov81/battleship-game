import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import type { PublicShipStatus } from '@battleship/contracts';
import { LocalizationService } from './localization/localization.service';

@Component({
  selector: 'app-fleet-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fleet-status.component.html',
})
export class FleetStatusComponent {
  protected readonly locale = inject(LocalizationService);

  readonly ships = input.required<readonly PublicShipStatus[]>();

  protected readonly sunkCount = computed(() => this.ships().filter(ship => ship.sunk).length);
}
