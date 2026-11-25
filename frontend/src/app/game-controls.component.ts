import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import type { GamePhase } from '@battleship/contracts';
import { LocalizationService } from './localization/localization.service';
import { botLabel } from './localization/messages';

export interface BotOption {
  id: string;
  label: string;
}
@Component({
  selector: 'app-game-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-controls.component.html',
})
export class GameControlsComponent {
  protected readonly locale = inject(LocalizationService);

  protected readonly botLabel = botLabel;

  readonly bots = input.required<readonly BotOption[]>();
  readonly selectedBotId = input.required<string>();
  readonly phase = input<GamePhase>();
  readonly loading = input.required<boolean>();

  readonly selectedBotIdChange = output<string>();
  readonly newGame = output<void>();
  readonly randomize = output<void>();
  readonly start = output<void>();
}
