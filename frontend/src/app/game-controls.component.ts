import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { GamePhase } from '@battleship/contracts';

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
  readonly bots = input.required<readonly BotOption[]>();
  readonly selectedBotId = input.required<string>();
  readonly phase = input<GamePhase>();
  readonly loading = input.required<boolean>();

  readonly selectedBotIdChange = output<string>();
  readonly newGame = output<void>();
  readonly randomize = output<void>();
  readonly start = output<void>();
}
