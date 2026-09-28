import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DcaEngineService } from '../../../../core';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-cards.component.html',
})
export class KpiCardsComponent {
  readonly dcaEngine = inject(DcaEngineService);
}
