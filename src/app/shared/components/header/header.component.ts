import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { PwaService, PwaToastService, ThemeService } from 'pwa-ui-core/services';
import { QuoteService } from '../../../core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly themeService = inject(ThemeService);
  readonly pwaService = inject(PwaService);
  readonly quoteService = inject(QuoteService);
  private readonly toastService = inject(PwaToastService);

  readonly openAddAsset = output<void>();
  readonly openSettings = output<void>();

  async syncQuotes(): Promise<void> {
    const { successCount, failureCount } = await this.quoteService.updateAllQuotes();
    if (failureCount === 0 && successCount > 0) {
      this.toastService.success(
        'Cotizaciones actualizadas',
        `Se han actualizado ${successCount} activos con éxito.`,
      );
    } else if (successCount > 0 && failureCount > 0) {
      this.toastService.warning(
        'Actualización parcial',
        `${successCount} actualizados, ${failureCount} con error (puedes ajustar el precio manualmente).`,
      );
    } else if (failureCount > 0) {
      this.toastService.error(
        'Error de conexión de mercado',
        'No se pudieron consultar cotizaciones. Revisa tu API o edita los precios directamente en la tabla.',
      );
    }
  }

  async installPwa(): Promise<void> {
    const accepted = await this.pwaService.promptInstall();
    if (accepted) {
      this.toastService.success(
        'DipWise instalada',
        'La aplicación ahora está disponible en tu sistema.',
      );
    }
  }
}
