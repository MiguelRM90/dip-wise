import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PwaToastService } from 'pwa-ui-core/services';
import { DcaEngineService } from '../../../../core/services/dca-engine.service';
import { StorageService } from '../../../../core/services/storage.service';
import { QuoteService } from '../../../../core/services/quote.service';
import { Asset } from '../../../../core/models/asset.model';

@Component({
  selector: 'app-allocation-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @let s = dcaEngine.summary();

    <div class="pwa-card" style="padding: 0; overflow: hidden;">
      <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--pwa-border); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <h2 style="font-size: var(--pwa-text-base); font-weight: 700; color: var(--pwa-text-primary); margin: 0;">
              Cálculo de Aportación Táctica por Activo
            </h2>
            <span class="pwa-badge pwa-badge--info">
              {{ s.allocations.length }}
            </span>
          </div>
          <p style="font-size: var(--pwa-text-xs); color: var(--pwa-text-secondary); margin: 0.25rem 0 0 0;">
            Edita los precios y ATH directamente en las casillas para simulación inmediata.
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button
            type="button"
            (click)="openAddAsset.emit()"
            class="pwa-btn pwa-btn--primary pwa-btn--sm"
            style="background-color: var(--pwa-success);"
          >
            <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Activo</span>
          </button>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table class="pwa-table">
          <thead>
            <tr>
              <th scope="col">Activo / ISIN</th>
              <th scope="col">Categoría</th>
              <th scope="col" style="text-align: right;">ATH (€)</th>
              <th scope="col" style="text-align: right;">Precio Actual (€)</th>
              <th scope="col" style="text-align: center;">Caída %</th>
              <th scope="col" style="text-align: center;">Puntos</th>
              <th scope="col" style="text-align: center;">Pond. / Mult.</th>
              <th scope="col" style="text-align: right;">Extra (€)</th>
              <th scope="col" style="text-align: right;">Aportación (€)</th>
              <th scope="col" style="text-align: right;">% Cartera</th>
              <th scope="col" style="text-align: center;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (row of s.allocations; track row.asset.id) {
              <tr>
                <td>
                  <div style="font-weight: 700; color: var(--pwa-text-primary); display: flex; align-items: center; gap: 0.375rem;">
                    <span>{{ row.asset.ticker }}</span>
                    @if (row.asset.status === 'loading') {
                      <span class="pwa-badge-dot pwa-badge-dot--pulse" style="color: var(--pwa-brand-500);" title="Actualizando cotización..."></span>
                    } @else if (row.asset.status === 'error') {
                      <span class="pwa-badge-dot" style="color: var(--pwa-danger); cursor: pointer;" [title]="row.asset.statusMessage || 'Error de cotización'"></span>
                    } @else if (row.asset.status === 'success') {
                      <span class="pwa-badge-dot" style="color: var(--pwa-success);" [title]="row.asset.statusMessage || 'Cotización actualizada'"></span>
                    }
                  </div>
                  <div style="font-size: var(--pwa-text-2xs); color: var(--pwa-text-secondary); font-family: var(--pwa-font-mono);">
                    {{ row.asset.isin }}
                  </div>
                  <div style="font-size: var(--pwa-text-2xs); color: var(--pwa-text-muted); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" [title]="row.asset.name">
                    {{ row.asset.name }}
                  </div>
                </td>

                <td style="white-space: nowrap;">
                  @if (row.asset.category === 'equity') {
                    <span class="pwa-badge" style="background-color: rgba(99, 102, 241, 0.12); color: #6366f1; border-color: rgba(99, 102, 241, 0.3);">
                      Renta Variable
                    </span>
                  } @else {
                    <span class="pwa-badge pwa-badge--warning">
                      Oro / Refugio
                    </span>
                  }
                </td>

                <td style="white-space: nowrap; text-align: right;">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [ngModel]="row.asset.athPrice"
                    (ngModelChange)="onPriceChange(row.asset, row.asset.currentPrice, $event)"
                    class="pwa-input"
                    style="width: 5.5rem; min-height: 32px; padding: 0.25rem 0.5rem; text-align: right; font-weight: 600; font-size: var(--pwa-text-xs);"
                  />
                </td>

                <td style="white-space: nowrap; text-align: right;">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [ngModel]="row.asset.currentPrice"
                    (ngModelChange)="onPriceChange(row.asset, $event, row.asset.athPrice)"
                    class="pwa-input"
                    style="width: 5.5rem; min-height: 32px; padding: 0.25rem 0.5rem; text-align: right; font-weight: 600; font-size: var(--pwa-text-xs);"
                  />
                </td>

                <td style="white-space: nowrap; text-align: center;">
                  <span
                    class="pwa-badge"
                    [ngClass]="getDrawdownClasses(row.drawdownPercentage)"
                    style="font-weight: 700;"
                  >
                    {{ row.drawdownPercentage > 0 ? '-' : '' }}{{ Math.abs(row.drawdownPercentage) | number: '1.2-2' }}%
                  </span>
                </td>

                <td style="white-space: nowrap; text-align: center;">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;" [title]="row.tramo.description">
                    <span class="pwa-badge" style="font-weight: 800; font-size: var(--pwa-text-2xs);">
                      {{ row.points }} pts
                    </span>
                    <span
                      class="pwa-badge"
                      [ngClass]="getTramoBadgeClasses(row.drawdownPercentage)"
                      style="font-size: 10px; padding: 0.125rem 0.375rem;"
                    >
                      <span>{{ row.tramo.icon }}</span>
                      <span>{{ row.tramo.badge }}</span>
                    </span>
                  </div>
                </td>

                <td style="white-space: nowrap; text-align: center; font-size: var(--pwa-text-2xs); color: var(--pwa-text-secondary);">
                  <span style="font-weight: 600; color: var(--pwa-text-primary);">{{ row.asset.baseWeightPercentage }}%</span>
                  @if (row.asset.category === 'equity') {
                    <span style="color: var(--pwa-text-muted);"> (×{{ row.asset.dynamicMultiplier }})</span>
                  }
                </td>

                <td style="white-space: nowrap; text-align: right; font-family: var(--pwa-font-mono); font-weight: 500;">
                  @if (row.asset.category === 'equity') {
                    <span [style.color]="row.extraAllocation > 0 ? 'var(--pwa-success-text)' : 'inherit'">
                      +{{ row.extraAllocation | currency: 'EUR' : 'symbol' : '1.2-2' }}
                    </span>
                  } @else {
                    <span style="color: var(--pwa-text-muted);">—</span>
                  }
                </td>

                <td style="white-space: nowrap; text-align: right;">
                  <span class="pwa-badge pwa-badge--info" style="font-size: var(--pwa-text-sm); font-weight: 800; padding: 0.375rem 0.625rem;">
                    {{ row.finalAllocation | currency: 'EUR' : 'symbol' : '1.2-2' }}
                  </span>
                </td>

                <td style="white-space: nowrap; text-align: right; font-weight: 600; color: var(--pwa-text-primary);">
                  {{ row.portfolioWeightPercentage | number: '1.1-1' }}%
                </td>

                <td style="white-space: nowrap; text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
                    <button
                      type="button"
                      (click)="refreshAsset(row.asset)"
                      class="pwa-btn pwa-btn--ghost pwa-btn--icon"
                      style="min-height: 30px; min-width: 30px; padding: 0.25rem;"
                      title="Refrescar cotización individual"
                    >
                      <svg style="width: 0.875rem; height: 0.875rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      (click)="editAsset.emit(row.asset)"
                      class="pwa-btn pwa-btn--ghost pwa-btn--icon"
                      style="min-height: 30px; min-width: 30px; padding: 0.25rem;"
                      title="Editar datos del activo"
                    >
                      <svg style="width: 0.875rem; height: 0.875rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      (click)="deleteAsset(row.asset)"
                      class="pwa-btn pwa-btn--ghost pwa-btn--icon"
                      style="min-height: 30px; min-width: 30px; padding: 0.25rem; color: var(--pwa-danger);"
                      title="Eliminar activo"
                    >
                      <svg style="width: 0.875rem; height: 0.875rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="11" style="padding: 3rem 1rem; text-align: center; color: var(--pwa-text-muted);">
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;">
                    <span style="font-size: 2rem;">📭</span>
                    <span style="font-size: var(--pwa-text-sm); font-weight: 600; color: var(--pwa-text-primary);">No hay activos registrados en tu cartera</span>
                    <span style="font-size: var(--pwa-text-xs);">Haz clic en "Nuevo Activo" para añadir tus fondos o ETFs por ISIN.</span>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AllocationTableComponent {
  readonly dcaEngine = inject(DcaEngineService);
  private readonly storage = inject(StorageService);
  private readonly quoteService = inject(QuoteService);
  private readonly toast = inject(PwaToastService);

  readonly openAddAsset = output<void>();
  readonly editAsset = output<Asset>();

  protected readonly Math = Math;

  onPriceChange(asset: Asset, currentPrice: number, athPrice: number): void {
    const validCurrent = isNaN(currentPrice) ? 0 : Number(currentPrice);
    const validAth = isNaN(athPrice) ? 0 : Number(athPrice);
    this.storage.updateInlinePrices(asset.id, validCurrent, validAth);
  }

  async refreshAsset(asset: Asset): Promise<void> {
    const res = await this.quoteService.updateSingleAssetQuote(asset);
    if (res.success) {
      this.toast.success(
        `Cotización actualizada: ${asset.ticker}`,
        `Precio: ${res.price} € | ATH: ${res.ath} €`
      );
    } else {
      this.toast.error(
        `Error al consultar ${asset.ticker}`,
        res.error || 'No se pudo obtener cotización automática.'
      );
    }
  }

  deleteAsset(asset: Asset): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el activo ${asset.ticker} (${asset.isin})?`)) {
      this.storage.deleteAsset(asset.id);
      this.toast.info('Activo eliminado', `${asset.ticker} ha sido removido de la cartera.`);
    }
  }

  getTramoBadgeClasses(drawdown: number): string {
    if (drawdown <= 2.0) return 'pwa-badge--info';
    if (drawdown <= 5.0) return '';
    if (drawdown <= 10.0) return 'pwa-badge--success';
    if (drawdown <= 20.0) return 'pwa-badge--warning';
    return 'pwa-badge--danger';
  }

  getDrawdownClasses(drawdown: number): string {
    if (drawdown <= 2.0) return 'pwa-badge--info';
    if (drawdown <= 5.0) return '';
    if (drawdown <= 10.0) return 'pwa-badge--success';
    if (drawdown <= 20.0) return 'pwa-badge--warning';
    return 'pwa-badge--danger';
  }
}
