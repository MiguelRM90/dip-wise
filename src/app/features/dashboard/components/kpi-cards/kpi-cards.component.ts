import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DcaEngineService } from '../../../../core/services/dca-engine.service';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    @let s = dcaEngine.summary();
    @let cfg = dcaEngine.settings();

    <div class="pwa-grid-kpis">
      <!-- KPI 1: Presupuesto Total -->
      <div class="pwa-card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: var(--pwa-text-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--pwa-text-secondary);">
            Presupuesto Total
          </span>
          <span style="padding: 0.5rem; border-radius: var(--pwa-radius-md); background-color: var(--pwa-brand-soft); color: var(--pwa-brand-text); display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div style="margin-top: 0.75rem;">
          <div style="font-size: var(--pwa-text-2xl); font-weight: 900; color: var(--pwa-text-primary); font-feature-settings: var(--pwa-font-features);">
            {{ s.totalBudget | currency: 'EUR' : 'symbol' : '1.2-2' }}
          </div>
          <div style="margin-top: 0.25rem; display: flex; align-items: center; justify-content: space-between; font-size: var(--pwa-text-xs); color: var(--pwa-text-secondary);">
            <span>{{ s.allocations.length }} activos registrados</span>
            <span style="font-weight: 500; color: var(--pwa-text-primary);">Aportación periódica</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Renta Variable -->
      <div class="pwa-card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.375rem;">
            <span style="font-size: var(--pwa-text-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--pwa-text-secondary);">
              Renta Variable
            </span>
            <span class="pwa-badge pwa-badge--info" style="font-weight: 700;">
              {{ cfg.equityPercentage }}%
            </span>
          </div>
          <span style="padding: 0.5rem; border-radius: var(--pwa-radius-md); background-color: rgba(99, 102, 241, 0.12); color: #6366f1; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
        </div>
        <div style="margin-top: 0.75rem;">
          <div style="font-size: var(--pwa-text-2xl); font-weight: 900; color: var(--pwa-text-primary); font-feature-settings: var(--pwa-font-features);">
            {{ s.equityAllocated | currency: 'EUR' : 'symbol' : '1.2-2' }}
          </div>
          <div style="margin-top: 0.25rem; display: flex; align-items: center; justify-content: space-between; font-size: var(--pwa-text-xs); color: var(--pwa-text-secondary);">
            <span>Fijo: {{ (s.equityBudget * (cfg.equityFixedBaseRatio / 100)) | currency: 'EUR' : 'symbol' : '1.0-0' }}</span>
            <span style="color: #6366f1; font-weight: 600;">
              Bolsa ATH: {{ (s.equityBudget * (cfg.equityDynamicRatio / 100)) | currency: 'EUR' : 'symbol' : '1.0-0' }}
            </span>
          </div>
        </div>
      </div>

      <!-- KPI 3: Oro / Refugio -->
      <div class="pwa-card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.375rem;">
            <span style="font-size: var(--pwa-text-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--pwa-text-secondary);">
              Oro / Refugio
            </span>
            <span class="pwa-badge pwa-badge--warning" style="font-weight: 700;">
              {{ cfg.safeHavenPercentage }}%
            </span>
          </div>
          <span style="padding: 0.5rem; border-radius: var(--pwa-radius-md); background-color: var(--pwa-warning-soft); color: var(--pwa-warning-text); display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
        </div>
        <div style="margin-top: 0.75rem;">
          <div style="font-size: var(--pwa-text-2xl); font-weight: 900; color: var(--pwa-text-primary); font-feature-settings: var(--pwa-font-features);">
            {{ s.safeHavenAllocated | currency: 'EUR' : 'symbol' : '1.2-2' }}
          </div>
          <div style="margin-top: 0.25rem; display: flex; align-items: center; justify-content: space-between; font-size: var(--pwa-text-xs); color: var(--pwa-text-secondary);">
            <span>Objetivo: {{ s.safeHavenBudget | currency: 'EUR' : 'symbol' : '1.2-2' }}</span>
            <span style="color: var(--pwa-warning-text); font-weight: 600;">Asignación Directa</span>
          </div>
        </div>
      </div>

      <!-- KPI 4: Control de Cuadre Exacto -->
      <div
        class="pwa-card"
        [style.border-color]="s.isExactMatch ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'"
        [style.background-color]="s.isExactMatch ? 'var(--pwa-success-soft)' : 'var(--pwa-danger-soft)'"
        style="display: flex; flex-direction: column; justify-content: space-between;"
      >
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span
            style="font-size: var(--pwa-text-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;"
            [style.color]="s.isExactMatch ? 'var(--pwa-success-text)' : 'var(--pwa-danger-text)'"
          >
            Estado de Cuadre
          </span>
          <span
            style="padding: 0.5rem; border-radius: var(--pwa-radius-md); display: flex; align-items: center; justify-content: center;"
            [style.background-color]="s.isExactMatch ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'"
            [style.color]="s.isExactMatch ? 'var(--pwa-success-text)' : 'var(--pwa-danger-text)'"
          >
            @if (s.isExactMatch) {
              <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            } @else {
              <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          </span>
        </div>
        <div style="margin-top: 0.75rem;">
          <div
            style="font-size: var(--pwa-text-lg); font-weight: 900; letter-spacing: -0.02em;"
            [style.color]="s.isExactMatch ? 'var(--pwa-success-text)' : 'var(--pwa-danger-text)'"
          >
            {{ s.isExactMatch ? '✓ Cuadrado exacto' : 'Desajuste detectado' }}
          </div>
          <div
            style="margin-top: 0.25rem; display: flex; align-items: center; justify-content: space-between; font-size: var(--pwa-text-xs);"
            [style.color]="s.isExactMatch ? 'var(--pwa-success-text)' : 'var(--pwa-danger-text)'"
          >
            <span>Diferencia: {{ s.unallocatedRemainder | currency: 'EUR' : 'symbol' : '1.2-2' }}</span>
            <span class="pwa-badge" [class.pwa-badge--success]="s.isExactMatch" [class.pwa-badge--danger]="!s.isExactMatch">
              {{ cfg.roundingMode === 'exact_integer' ? 'Hare-Niemeyer (€)' : 'Céntimos exactos' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class KpiCardsComponent {
  readonly dcaEngine = inject(DcaEngineService);
}
