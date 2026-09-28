import { Component, inject, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset, AssetCategory } from '../../../../core/models/asset.model';
import { YahooSearchQuote } from '../../../../core/models/quote.model';
import { StorageService } from '../../../../core/services/storage.service';
import { QuoteService } from '../../../../core/services/quote.service';
import { PwaToastService } from 'pwa-ui-core/services';

@Component({
  selector: 'app-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-opacity">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  {{ editingAsset() ? 'Editar Activo' : 'Nuevo Activo en Cartera' }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Introduce los datos del fondo o ETF por ISIN / Ticker
                </p>
              </div>
            </div>

            <button
              (click)="close.emit()"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Form Body -->
          <form (ngSubmit)="onSubmit()" class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- ISIN -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código ISIN <span class="text-rose-500">*</span>
                </label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="IE00B4L5Y983"
                    [(ngModel)]="formIsin"
                    name="formIsin"
                    (keyup.enter)="autoFetchQuote()"
                    class="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
                  />
                  <button
                    type="button"
                    (click)="autoFetchQuote()"
                    [disabled]="isFetchingQuote()"
                    class="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                    title="Buscar Ticker, Nombre y Precios automáticamente por ISIN"
                  >
                    @if (isFetchingQuote()) {
                      <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    } @else {
                      <span>🔍 Auto</span>
                    }
                  </button>
                </div>
              </div>

              <!-- Ticker -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ticker de Mercado <span class="text-rose-500">*</span>
                </label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="IWDA.AS o SP500"
                    [(ngModel)]="formTicker"
                    name="formTicker"
                    (keyup.enter)="autoFetchQuote()"
                    class="w-full px-3 py-2 text-xs font-semibold uppercase rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    (click)="autoFetchQuote()"
                    [disabled]="isFetchingQuote()"
                    class="shrink-0 px-2.5 py-1 text-xs font-medium rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                    title="Consultar precio y ATH en mercado por Ticker"
                  >
                    @if (isFetchingQuote()) {
                      <svg class="w-4 h-4 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    } @else {
                      <span>🔍 Auto</span>
                    }
                  </button>
                </div>
              </div>
            </div>

            <!-- Alternative markets pill selector if ISIN search returned multiple listings -->
            @if (alternativeQuotes().length > 1) {
              <div class="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-xs">
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="font-semibold text-sky-900 dark:text-sky-300">Bolsas / divisas disponibles:</span>
                  <span class="text-slate-500 dark:text-slate-400 text-[10px]">Haz clic para cambiar</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  @for (q of alternativeQuotes(); track q.symbol) {
                    <button
                      type="button"
                      (click)="selectAlternativeQuote(q)"
                      class="px-2 py-0.5 rounded-lg text-xs font-mono font-medium transition-colors"
                      [ngClass]="
                        formTicker === q.symbol
                          ? 'bg-sky-600 text-white font-bold shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-sky-500'
                      "
                    >
                      {{ q.symbol }}
                      <span class="text-[10px] opacity-75">({{ q.exchDisp || q.exchange || 'Mkt' }})</span>
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Asset Name -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Activo <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="iShares Core MSCI World UCITS ETF"
                [(ngModel)]="formName"
                name="formName"
                class="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría del Activo
              </label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  (click)="formCategory = 'equity'"
                  class="flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all"
                  [ngClass]="
                    formCategory === 'equity'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  "
                >
                  <span>📈 Renta Variable</span>
                </button>

                <button
                  type="button"
                  (click)="formCategory = 'safe_haven'"
                  class="flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all"
                  [ngClass]="
                    formCategory === 'safe_haven'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  "
                >
                  <span>🪙 Oro / Refugio</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Base Strategic Weight % -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ponderación Base (%)
                </label>
                <div class="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    [(ngModel)]="formBaseWeight"
                    name="formBaseWeight"
                    class="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <span class="absolute right-3 top-2 text-xs text-slate-400">%</span>
                </div>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Suma recomendada del 100% en {{ formCategory === 'equity' ? 'Renta Variable' : 'Oro' }}.
                </p>
              </div>

              <!-- Dynamic Multiplier -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Multiplicador Dinámico
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  [(ngModel)]="formMultiplier"
                  name="formMultiplier"
                  class="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Ej. 10 para 50%, 6 para 30%, 4 para 20%.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Current Price -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Precio Actual (€) <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    [(ngModel)]="formCurrentPrice"
                    name="formCurrentPrice"
                    class="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <span class="absolute right-3 top-2 text-xs text-slate-400">€</span>
                </div>
              </div>

              <!-- ATH -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Máximo Histórico ATH (€) <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    [(ngModel)]="formAthPrice"
                    name="formAthPrice"
                    class="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <span class="absolute right-3 top-2 text-xs text-slate-400">€</span>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                (click)="close.emit()"
                class="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                class="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors"
              >
                {{ editingAsset() ? 'Guardar Cambios' : 'Añadir a Cartera' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
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
      // 1. If ticker is empty, or user entered an ISIN in the ticker field, resolve via ISIN search
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

      // 2. Fetch prices (current and 52w ATH)
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
