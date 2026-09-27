import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { PwaService } from '../../../core/services/pwa.service';
import { QuoteService } from '../../../core/services/quote.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div class="flex items-center justify-between gap-4">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold text-xl">
              📈
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-xl font-black tracking-tight bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent">
                  DipWise
                </h1>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-300/40 dark:border-sky-700/50">
                  DCA Táctico ATH
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Value Averaging & Asignación Óptima por ISIN
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Online / Offline indicator -->
            <div
              class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              [ngClass]="
                pwaService.isOnline()
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
              "
            >
              <span
                class="w-2 h-2 rounded-full"
                [ngClass]="pwaService.isOnline() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"
              ></span>
              {{ pwaService.isOnline() ? 'Online' : 'Offline' }}
            </div>

            <!-- Install PWA button -->
            @if (pwaService.canInstall()) {
              <button
                (click)="installPwa()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all"
                title="Instalar en tu dispositivo"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span class="hidden sm:inline">Instalar App</span>
              </button>
            }

            <!-- Sync Quotes Button -->
            <button
              (click)="syncQuotes()"
              [disabled]="quoteService.isUpdating()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Actualizar cotizaciones del mercado"
            >
              <svg
                class="w-4 h-4 text-sky-600 dark:text-sky-400"
                [ngClass]="{ 'animate-spin': quoteService.isUpdating() }"
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
              <span class="hidden sm:inline">
                {{ quoteService.isUpdating() ? 'Actualizando...' : 'Actualizar Precios' }}
              </span>
            </button>

            <!-- Add Asset Button -->
            <button
              (click)="openAddAsset.emit()"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Añadir Activo</span>
            </button>

            <!-- Settings Button -->
            <button
              (click)="openSettings.emit()"
              class="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              title="Configuración de Cartera y API"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <!-- Theme Toggle -->
            <button
              (click)="themeService.toggleTheme()"
              class="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              title="Alternar Modo Oscuro/Claro"
            >
              @if (themeService.isDarkMode()) {
                <!-- Sun Icon -->
                <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              } @else {
                <!-- Moon Icon -->
                <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              }
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly themeService = inject(ThemeService);
  readonly pwaService = inject(PwaService);
  readonly quoteService = inject(QuoteService);
  private readonly toastService = inject(ToastService);

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

  async installPwa(): Promise<void> {
    const accepted = await this.pwaService.promptInstall();
    if (accepted) {
      this.toastService.success('DipWise instalada', 'La aplicación ahora está disponible en tu sistema.');
    }
  }
}
