import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PwaToastService } from 'pwa-ui-core/services';
import { Asset, DcaEngineService, QuoteService, StorageService } from '../../../../core';

@Component({
  selector: 'app-allocation-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './allocation-table.component.html',
  styleUrl: './allocation-table.component.css',
})
export class AllocationTableComponent {
  readonly dcaEngine = inject(DcaEngineService);
  private readonly storage = inject(StorageService);
  private readonly quoteService = inject(QuoteService);
  private readonly toast = inject(PwaToastService);

  readonly openAddAsset = output<void>();
  readonly editAsset = output<Asset>();

  protected readonly Math = Math;

  selectInputText(event: FocusEvent): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      target.select();
    }
  }

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
        `Precio: ${res.price} € | ATH: ${res.ath} €`,
      );
    } else {
      this.toast.error(
        `Error al consultar ${asset.ticker}`,
        res.error || 'No se pudo obtener cotización automática.',
      );
    }
  }

  deleteAsset(asset: Asset): void {
    if (
      confirm(`¿Estás seguro de que deseas eliminar el activo ${asset.ticker} (${asset.isin})?`)
    ) {
      this.storage.deleteAsset(asset.id);
      this.toast.info('Activo eliminado', `${asset.ticker} ha sido removido de la cartera.`);
    }
  }

  getTramoBadgeClasses(drawdown: number): Record<string, boolean> {
    if (drawdown <= 2.0) {
      return {
        'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300/40': true,
      };
    }
    if (drawdown <= 5.0) {
      return {
        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/40': true,
      };
    }
    if (drawdown <= 10.0) {
      return {
        'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300/40': true,
      };
    }
    if (drawdown <= 15.0) {
      return {
        'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/40': true,
      };
    }
    if (drawdown <= 20.0) {
      return {
        'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-300/40': true,
      };
    }
    return {
      'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300/40': true,
    };
  }

  getDrawdownClasses(drawdown: number): Record<string, boolean> {
    if (drawdown <= 2.0) {
      return {
        'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-300/40': true,
      };
    }
    if (drawdown <= 5.0) {
      return {
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/40': true,
      };
    }
    if (drawdown <= 10.0) {
      return {
        'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300/40': true,
      };
    }
    if (drawdown <= 20.0) {
      return {
        'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/40': true,
      };
    }
    if (drawdown <= 30.0) {
      return {
        'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border border-orange-300/40': true,
      };
    }
    return {
      'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300/40': true,
    };
  }
}
