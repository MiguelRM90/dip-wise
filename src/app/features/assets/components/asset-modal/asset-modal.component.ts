import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PwaToastService } from 'pwa-ui-core/services';
import {
  Asset,
  AssetCategory,
  QuoteService,
  StorageService,
  YahooSearchQuote,
} from '../../../../core';

@Component({
  selector: 'app-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-modal.component.html',
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
      const searchTarget = !ticker || isTickerActuallyIsin ? isin || ticker : null;

      if (searchTarget) {
        if (!this.formIsin && isTickerActuallyIsin) {
          this.formIsin = ticker;
        }

        const resolved = await this.quoteService.resolveTickerFromIsin(searchTarget);
        if (!resolved?.symbol) {
          this.toast.error(
            'Ticker no encontrado',
            `No se encontró ningún símbolo para ${searchTarget}. Introduce el Ticker manualmente.`,
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
        `${res.ticker}: ${res.price} € (Máx: ${this.formAthPrice} €)`,
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

    const assetId =
      this.editingAsset()?.id || `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

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
      `${assetToSave.ticker} (${assetToSave.isin}) guardado.`,
    );

    this.close.emit();
  }
}
