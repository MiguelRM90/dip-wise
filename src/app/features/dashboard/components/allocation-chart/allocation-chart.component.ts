import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DcaEngineService } from '../../../../core/services/dca-engine.service';
import { AssetAllocation } from '../../../../core/models/portfolio.model';

interface ChartSlice {
  allocation: AssetAllocation;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
  percentage: number;
}

const COLOR_PALETTE = [
  '#0284c7',
  '#10b981',
  '#6366f1',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
];

@Component({
  selector: 'app-allocation-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    @let s = dcaEngine.summary();

    <div class="pwa-card" style="display: flex; flex-direction: column; height: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid var(--pwa-border);">
        <div>
          <h3 style="font-size: var(--pwa-text-sm); font-weight: 700; color: var(--pwa-text-primary); margin: 0;">
            Distribución de Aportación Periódica
          </h3>
          <p style="font-size: var(--pwa-text-xs); color: var(--pwa-text-secondary); margin: 0.25rem 0 0 0;">
            Reparto táctico final del período actual
          </p>
        </div>
        <span class="pwa-badge pwa-badge--info">
          {{ s.allocations.length }} activos
        </span>
      </div>

      @if (s.allocations.length === 0) {
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem 0; color: var(--pwa-text-muted); font-size: var(--pwa-text-sm);">
          <span>No hay activos registrados</span>
        </div>
      } @else {
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; padding-top: 1rem;">
          <div style="position: relative; width: 12rem; height: 12rem; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke-width="14"
                style="stroke: var(--pwa-border-subtle);"
              />
              @for (slice of slices(); track slice.allocation.asset.id; let idx = $index) {
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke-width="14"
                  [attr.stroke]="slice.color"
                  [attr.stroke-dasharray]="slice.strokeDasharray"
                  [attr.stroke-dashoffset]="slice.strokeDashoffset"
                  (mouseenter)="hoveredAssetId.set(slice.allocation.asset.id)"
                  (mouseleave)="hoveredAssetId.set(null)"
                  style="transition: all 0.3s ease; cursor: pointer;"
                  [class.stroke-width-16]="hoveredAssetId() === slice.allocation.asset.id"
                />
              }
            </svg>

            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; text-align: center; padding: 0.5rem;">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: 600; color: var(--pwa-text-muted); letter-spacing: 0.05em;">Total</span>
              <span style="font-size: var(--pwa-text-base); font-weight: 900; color: var(--pwa-text-primary); line-height: 1.2;">
                {{ s.allocatedBudget | currency: 'EUR' : 'symbol' : '1.0-0' }}
              </span>
              <span style="font-size: 10px; color: var(--pwa-success); font-weight: 700;">100%</span>
            </div>
          </div>

          <div style="width: 100%; display: flex; flex-direction: column; gap: 0.5rem; max-height: 14rem; overflow-y: auto;">
            @for (slice of slices(); track slice.allocation.asset.id) {
              <div
                (mouseenter)="hoveredAssetId.set(slice.allocation.asset.id)"
                (mouseleave)="hoveredAssetId.set(null)"
                class="pwa-card pwa-card--interactive"
                [style.padding]="'0.5rem 0.75rem'"
                [style.background-color]="hoveredAssetId() === slice.allocation.asset.id ? 'var(--pwa-bg-card-hover)' : 'transparent'"
                [style.border-color]="hoveredAssetId() === slice.allocation.asset.id ? 'var(--pwa-border-strong)' : 'var(--pwa-border-subtle)'"
                style="display: flex; align-items: center; justify-content: space-between; font-size: var(--pwa-text-xs);"
              >
                <div style="display: flex; align-items: center; gap: 0.625rem; min-width: 0;">
                  <span
                    style="width: 0.75rem; height: 0.75rem; border-radius: 50%; flex-shrink: 0;"
                    [style.background-color]="slice.color"
                  ></span>
                  <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <div style="font-weight: 700; color: var(--pwa-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ slice.allocation.asset.ticker }}
                    </div>
                    <div style="font-size: 10px; color: var(--pwa-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ slice.allocation.asset.name }}
                    </div>
                  </div>
                </div>

                <div style="text-align: right; flex-shrink: 0; padding-left: 0.5rem;">
                  <div style="font-weight: 700; color: var(--pwa-text-primary);">
                    {{ slice.allocation.finalAllocation | currency: 'EUR' : 'symbol' : '1.2-2' }}
                  </div>
                  <div style="font-size: 10px; font-weight: 600; color: var(--pwa-brand-text);">
                    {{ slice.percentage }}%
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .stroke-width-16 {
        stroke-width: 17;
      }
    `,
  ],
})
export class AllocationChartComponent {
  readonly dcaEngine = inject(DcaEngineService);
  readonly hoveredAssetId = signal<string | null>(null);

  readonly slices = computed<ChartSlice[]>(() => {
    const summary = this.dcaEngine.summary();
    const allocations = summary.allocations;
    const total = summary.allocatedBudget;

    if (total <= 0 || allocations.length === 0) {
      return [];
    }

    const circumference = 2 * Math.PI * 38;
    let accumulatedLength = 0;

    return allocations.map((allocation, index) => {
      const percentage = (allocation.finalAllocation / total) * 100;
      const sliceLength = (allocation.finalAllocation / total) * circumference;
      const strokeDasharray = `${sliceLength} ${circumference - sliceLength}`;
      const strokeDashoffset = -accumulatedLength;

      accumulatedLength += sliceLength;

      return {
        allocation,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
        strokeDasharray,
        strokeDashoffset,
        percentage: Math.round(percentage * 10) / 10,
      };
    });
  });
}
