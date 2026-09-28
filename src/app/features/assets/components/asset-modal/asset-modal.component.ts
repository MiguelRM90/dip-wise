import { Component, inject, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PwaModalComponent } from 'pwa-ui-core/components';
import { PwaToastService } from 'pwa-ui-core/services';
import { Asset, AssetCategory } from '../../../../core/models/asset.model';
import { YahooSearchQuote } from '../../../../core/models/quote.model';
import { StorageService } from '../../../../core/services/storage.service';
import { QuoteService } from '../../../../core/services/quote.service';

@Component({
  selector: 'app-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PwaModalComponent],
  template: `
    <pwa-modal
      [isOpen]="isOpen()"
      [title]="editingAsset() ? 'Editar Activo' : 'Nuevo Activo en Cartera'"
      subtitle="Introduce los datos del fondo o ETF por ISIN / Ticker"
      maxWidth="38rem"
      (close)="close.emit()"
    >
      <span
        modal-icon
        style="padding: 0.5rem; border-radius: var(--pwa-radius-md); background-color: var(--pwa-brand-soft); color: var(--pwa-brand-text); display: flex; align-items: center; justify-content: center;"
      >
        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </span>

      <!-- Form Body -->
      <form (ngSubmit)="onSubmit()" id="assetForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
          <!-- ISIN & Ticker row -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <!-- ISIN -->
            <div class="pwa-input-group">
              <label class="pwa-label">
                Código ISIN <span style="color: var(--pwa-danger);">*</span>
              </label>
              <div style="display: flex; gap: 0.5rem;">
                <input
                  type="text"
                  required
                  placeholder="IE00B4L5Y983"
                  [(ngModel)]="formIsin"
                  name="formIsin"
                  (keyup.enter)="autoFetchQuote()"
                  class="pwa-input"
                  style="font-family: var(--pwa-font-mono); text-transform: uppercase;"
                />
                <button
                  type="button"
                  (click)="autoFetchQuote()"
                  [disabled]="isFetchingQuote()"
                  class="pwa-btn pwa-btn--primary pwa-btn--sm"
                  title="Buscar Ticker, Nombre y Precios automáticamente por ISIN"
                >
                  @if (isFetchingQuote()) {
                    <span class="pwa-animate-spin">⏳</span>
                  } @else {
                    <span>🔍</span>
                  }
                </button>
              </div>
            </div>

            <!-- Ticker -->
            <div class="pwa-input-group">
              <label class="pwa-label">
                Ticker <span style="color: var(--pwa-danger);">*</span>
              </label>
              <div style="display: flex; gap: 0.5rem;">
                <input
                  type="text"
                  required
                  placeholder="IWDA.AS"
                  [(ngModel)]="formTicker"
                  name="formTicker"
                  (keyup.enter)="autoFetchQuote()"
                  class="pwa-input"
                  style="font-weight: 700; text-transform: uppercase;"
                />
                <button
                  type="button"
                  (click)="autoFetchQuote()"
                  [disabled]="isFetchingQuote()"
                  class="pwa-btn pwa-btn--secondary pwa-btn--sm"
                  title="Consultar precio y ATH en mercado por Ticker"
                >
                  @if (isFetchingQuote()) {
                    <span class="pwa-animate-spin">⏳</span>
                  } @else {
                    <span>🔍</span>
                  }
                </button>
              </div>
            </div>
          </div>

          <!-- Alternative markets pill selector if ISIN search returned multiple listings -->
          @if (alternativeQuotes().length > 1) {
            <div class="pwa-card pwa-card--subtle" style="padding: 0.75rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.375rem; font-size: var(--pwa-text-xs);">
                <span style="font-weight: 600; color: var(--pwa-brand-text);">Bolsas / divisas disponibles:</span>
                <span style="font-size: var(--pwa-text-2xs); color: var(--pwa-text-muted);">Haz clic para cambiar</span>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 0.375rem;">
                @for (q of alternativeQuotes(); track q.symbol) {
                  <button
                    type="button"
                    (click)="selectAlternativeQuote(q)"
                    class="pwa-btn pwa-btn--sm"
                    [ngClass]="formTicker === q.symbol ? 'pwa-btn--primary' : 'pwa-btn--secondary'"
                    style="font-family: var(--pwa-font-mono);"
                  >
                    {{ q.symbol }}
                    <span style="font-size: 10px; opacity: 0.8;">({{ q.exchDisp || q.exchange || 'Mkt' }})</span>
                  </button>
                }
              </div>
            </div>
          }

          <!-- Asset Name -->
          <div class="pwa-input-group">
            <label class="pwa-label">
              Nombre del Activo <span style="color: var(--pwa-danger);">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="iShares Core MSCI World UCITS ETF"
              [(ngModel)]="formName"
              name="formName"
              class="pwa-input"
            />
          </div>

          <!-- Category -->
          <div class="pwa-input-group">
            <label class="pwa-label">
              Categoría del Activo
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <button
                type="button"
                (click)="formCategory = 'equity'"
                class="pwa-btn"
                [ngClass]="formCategory === 'equity' ? 'pwa-btn--primary' : 'pwa-btn--secondary'"
                [style.background-color]="formCategory === 'equity' ? '#6366f1' : ''"
              >
                <span>📈 Renta Variable</span>
              </button>

              <button
                type="button"
                (click)="formCategory = 'safe_haven'"
                class="pwa-btn"
                [ngClass]="formCategory === 'safe_haven' ? 'pwa-btn--primary' : 'pwa-btn--secondary'"
                [style.background-color]="formCategory === 'safe_haven' ? 'var(--pwa-warning)' : ''"
              >
                <span>🪙 Oro / Refugio</span>
              </button>
            </div>
          </div>

          <!-- Weights and Multiplier row -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="pwa-input-group">
              <label class="pwa-label">Ponderación Base (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                required
                [(ngModel)]="formBaseWeight"
                name="formBaseWeight"
                class="pwa-input"
              />
              <span class="pwa-hint">Suma recomendada del 100% en {{ formCategory === 'equity' ? 'Renta Variable' : 'Oro' }}.</span>
            </div>

            <div class="pwa-input-group">
              <label class="pwa-label">Multiplicador Dinámico</label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                [(ngModel)]="formMultiplier"
                name="formMultiplier"
                class="pwa-input"
              />
              <span class="pwa-hint">Ej. 10 para 50%, 6 para 30%, 4 para 20%.</span>
            </div>
          </div>

          <!-- Prices row -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="pwa-input-group">
              <label class="pwa-label">
                Precio Actual (€) <span style="color: var(--pwa-danger);">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                [(ngModel)]="formCurrentPrice"
                name="formCurrentPrice"
                class="pwa-input"
              />
            </div>

            <div class="pwa-input-group">
              <label class="pwa-label">
                Máximo Histórico ATH (€) <span style="color: var(--pwa-danger);">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                [(ngModel)]="formAthPrice"
                name="formAthPrice"
                class="pwa-input"
              />
            </div>
          </div>
        </div>
      </form>

      <!-- Modal Footer -->
      <div modal-footer style="display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; width: 100%;">
        <button
          type="button"
          (click)="close.emit()"
          class="pwa-btn pwa-btn--secondary"
        >
          Cancelar
        </button>

        <button
          type="submit"
          form="assetForm"
          class="pwa-btn pwa-btn--primary"
        >
          {{ editingAsset() ? 'Guardar Cambios' : 'Añadir a Cartera' }}
        </button>
      </div>
    </pwa-modal>
  `,
})
export class AssetModalComponent {
  private readonly storage = inject(StorageService);
  private readonly quoteService = inject(QuoteService);
  private readonly toast = inject(PwaToastService);

  readonly isOpen = input<boolean>(false);
  readonly editingAsset = input<Asset | null>(null);

  readonly close = output<void>();

  readonly isFetchingQuote = signal<boolean>(false);
  readonly alternativeQuotes = signal<YahooSearchQuote[]>([]);

  formIsin = '';
  formTicker = '';
  formName = '';
  formCategory: AssetCategory = 'equity';
  formBaseWeight = 50;
  formMultiplier = 10;
  formCurrentPrice = 100;
  formAthPrice = 100;

  constructor() {
    effect(() => {
      const asset = this.editingAsset();
      this.alternativeQuotes.set([]);
      if (asset) {
        this.formIsin = asset.isin;
        this.formTicker = asset.ticker;
        this.formName = asset.name;
        this.formCategory = asset.category;
        this.formBaseWeight = asset.baseWeightPercentage;
        this.formMultiplier = asset.dynamicMultiplier;
        this.formCurrentPrice = asset.currentPrice;
        this.formAthPrice = asset.athPrice;
      } else {
        this.formIsin = '';
        this.formTicker = '';
        this.formName = '';
        this.formCategory = 'equity';
        this.formBaseWeight = 25;
        this.formMultiplier = 5;
        this.formCurrentPrice = 0;
        this.formAthPrice = 0;
      }
    });
  }

  async autoFetchQuote(): Promise<void> {
    const isin = this.formIsin.trim().toUpperCase();
    let ticker = this.formTicker.trim().toUpperCase();

    if (!isin && !ticker) {
      this.toast.warning('Datos requeridos', 'Introduce el código ISIN o el Ticker para buscar.');
      return;
    }

    this.isFetchingQuote.set(true);

    try {
      const isTickerActuallyIsin = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/i.test(ticker);
      const searchTarget = !ticker || isTickerActuallyIsin ? (isin || ticker) : null;

      if (searchTarget) {
        if (!this.formIsin && isTickerActuallyIsin) {
          this.formIsin = ticker;
        }

        const resolved = await this.quoteService.resolveTickerFromIsin(searchTarget);
        if (!resolved?.symbol) {
          this.toast.error(
            'Ticker no encontrado',
            `No se encontró ningún símbolo para ${searchTarget}. Introduce el Ticker manualmente.`
          );
          return;
        }

        ticker = resolved.symbol.toUpperCase();
        this.formTicker = ticker;
        this.alternativeQuotes.set(resolved.quotes || []);

        if (resolved.name && !this.formName.trim()) {
          this.formName = resolved.name;
        }
      }

      await this.fetchQuoteOnly(ticker);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al consultar mercado';
      this.toast.error('Error de consulta', msg);
    } finally {
      this.isFetchingQuote.set(false);
    }
  }

  async selectAlternativeQuote(quote: YahooSearchQuote): Promise<void> {
    this.formTicker = quote.symbol.toUpperCase();
    if ((quote.longname || quote.shortname) && !this.formName.trim()) {
      this.formName = quote.longname || quote.shortname || '';
    }
    this.isFetchingQuote.set(true);
    try {
      await this.fetchQuoteOnly(quote.symbol);
    } finally {
      this.isFetchingQuote.set(false);
    }
  }

  private async fetchQuoteOnly(ticker: string): Promise<void> {
    const tempAsset: Asset = {
      id: 'temp',
      isin: this.formIsin,
      ticker: ticker,
      name: this.formName,
      category: this.formCategory,
      baseWeightPercentage: this.formBaseWeight,
      dynamicMultiplier: this.formMultiplier,
      currentPrice: this.formCurrentPrice,
      athPrice: this.formAthPrice,
    };

    const res = await this.quoteService.updateSingleAssetQuote(tempAsset);

    if (res.success && res.price) {
      this.formCurrentPrice = res.price;
      this.formAthPrice = res.ath || res.price;
      if (res.name && !this.formName.trim()) {
        this.formName = res.name;
      }
      this.toast.success(
        'Datos de mercado obtenidos',
        `${res.ticker}: ${res.price} € (Máx: ${this.formAthPrice} €)`
      );
    } else {
      this.toast.error('Consulta no exitosa', res.error || 'Verifica el ticker o la conexión.');
    }
  }

  onSubmit(): void {
    if (!this.formIsin.trim() || !this.formTicker.trim() || !this.formName.trim()) {
      this.toast.warning('Campos incompletos', 'ISIN, Ticker y Nombre son obligatorios.');
      return;
    }

    const assetId = this.editingAsset()?.id || `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const assetToSave: Asset = {
      id: assetId,
      isin: this.formIsin.trim().toUpperCase(),
      ticker: this.formTicker.trim().toUpperCase(),
      name: this.formName.trim(),
      category: this.formCategory,
      baseWeightPercentage: Number(this.formBaseWeight) || 0,
      dynamicMultiplier: Number(this.formMultiplier) || 1,
      currentPrice: Number(this.formCurrentPrice) || 0,
      athPrice: Number(this.formAthPrice) || Number(this.formCurrentPrice) || 0,
      status: 'idle',
      statusMessage: 'Ready',
    };

    this.storage.saveAsset(assetToSave);
    this.toast.success(
      this.editingAsset() ? 'Activo modificado' : 'Activo añadido',
      `${assetToSave.ticker} (${assetToSave.isin}) guardado.`
    );

    this.close.emit();
  }
}
