import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaHeaderComponent } from 'pwa-ui-core/components';
import { ThemeService, PwaService, PwaToastService } from 'pwa-ui-core/services';
import { QuoteService } from '../../../core/services/quote.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, PwaHeaderComponent],
  template: `
    <pwa-header
      title="DipWise"
      subtitle="Value Averaging & Asignación Óptima por ISIN"
      badgeText="DCA Táctico ATH"
      installButtonText="Instalar App"
      (installed)="onInstalled($event)"
    >
      <div
        header-logo
        style="width: 2.5rem; height: 2.5rem; border-radius: var(--pwa-radius-md); background: linear-gradient(135deg, #0284c7, #10b981); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #ffffff; box-shadow: var(--pwa-shadow-sm);"
      >
        📈
      </div>

      <div header-actions style="display: flex; align-items: center; gap: 0.5rem;">
        <button
          type="button"
          (click)="syncQuotes()"
          [disabled]="quoteService.isUpdating()"
          class="pwa-btn pwa-btn--secondary pwa-btn--sm"
          title="Actualizar cotizaciones del mercado"
        >
          <svg
            style="width: 1rem; height: 1rem; color: var(--pwa-brand-500);"
            [class.pwa-animate-spin]="quoteService.isUpdating()"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span class="dw-hide-mobile">
            {{ quoteService.isUpdating() ? 'Actualizando...' : 'Actualizar Precios' }}
          </span>
        </button>

        <button
          type="button"
          (click)="openAddAsset.emit()"
          class="pwa-btn pwa-btn--primary pwa-btn--sm"
          style="background-color: var(--pwa-success);"
        >
          <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Añadir Activo</span>
        </button>

        <button
          type="button"
          (click)="openSettings.emit()"
          class="pwa-btn pwa-btn--ghost pwa-btn--icon"
          title="Configuración de Cartera y API"
        >
          <svg style="width: 1.125rem; height: 1.125rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          type="button"
          (click)="themeService.toggleTheme()"
          class="pwa-btn pwa-btn--ghost pwa-btn--icon"
          title="Alternar Modo Oscuro/Claro"
        >
          @if (themeService.isDark()) {
            <svg style="width: 1.125rem; height: 1.125rem; color: #f59e0b;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          } @else {
            <svg style="width: 1.125rem; height: 1.125rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          }
        </button>
      </div>
    </pwa-header>
  `,
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
        `Se han actualizado ${successCount} activos con éxito.`
      );
    } else if (successCount > 0 && failureCount > 0) {
      this.toastService.warning(
        'Actualización parcial',
        `${successCount} actualizados, ${failureCount} con error (puedes ajustar el precio manualmente).`
      );
    } else if (failureCount > 0) {
      this.toastService.error(
        'Error de conexión de mercado',
        'No se pudieron consultar cotizaciones. Revisa tu API o edita los precios directamente en la tabla.'
      );
    }
  }

  onInstalled(accepted: boolean): void {
    if (accepted) {
      this.toastService.success('DipWise instalada', 'La aplicación ahora está disponible en tu sistema.');
    }
  }
}
