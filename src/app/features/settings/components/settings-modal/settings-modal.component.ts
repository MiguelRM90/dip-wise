import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PwaModalComponent } from 'pwa-ui-core/components';
import { PwaToastService } from 'pwa-ui-core/services';
import { StorageService } from '../../../../core/services/storage.service';
import {
  PortfolioSettings,
  RoundingMode,
  QuoteProviderType,
} from '../../../../core/models/portfolio.model';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PwaModalComponent],
  template: `
    <pwa-modal
      [isOpen]="isOpen()"
      title="Configuración del Sistema"
      subtitle="Parámetros DCA, integración de mercado y copias de seguridad"
      maxWidth="42rem"
      (close)="close.emit()"
    >
      <span
        modal-icon
        style="padding: 0.5rem; border-radius: var(--pwa-radius-md); background-color: var(--pwa-brand-soft); color: var(--pwa-brand-text); display: flex; align-items: center; justify-content: center;"
      >
        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </span>

      <!-- Navigation Tabs -->
      <div style="display: flex; border-bottom: 1px solid var(--pwa-border); gap: 0.5rem; margin-bottom: 1.25rem;">
        <button
          type="button"
          (click)="activeTab.set('strategy')"
          class="pwa-btn pwa-btn--ghost pwa-btn--sm"
          [style.border-bottom]="activeTab() === 'strategy' ? '2px solid var(--pwa-brand-500)' : 'none'"
          [style.color]="activeTab() === 'strategy' ? 'var(--pwa-brand-text)' : 'inherit'"
          [style.border-radius]="'0'"
        >
          1. Estrategia & Presupuesto
        </button>
        <button
          type="button"
          (click)="activeTab.set('api')"
          class="pwa-btn pwa-btn--ghost pwa-btn--sm"
          [style.border-bottom]="activeTab() === 'api' ? '2px solid var(--pwa-brand-500)' : 'none'"
          [style.color]="activeTab() === 'api' ? 'var(--pwa-brand-text)' : 'inherit'"
          [style.border-radius]="'0'"
        >
          2. Integración de API
        </button>
        <button
          type="button"
          (click)="activeTab.set('backup')"
          class="pwa-btn pwa-btn--ghost pwa-btn--sm"
          [style.border-bottom]="activeTab() === 'backup' ? '2px solid var(--pwa-brand-500)' : 'none'"
          [style.color]="activeTab() === 'backup' ? 'var(--pwa-brand-text)' : 'inherit'"
          [style.border-radius]="'0'"
        >
          3. Copia de Seguridad & Datos
        </button>
      </div>

      <!-- Tab Content -->
      @if (activeTab() === 'strategy') {
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <!-- Total Budget -->
          <div class="pwa-input-group">
            <label class="pwa-label">
              Presupuesto Periódico Total (€)
            </label>
            <input
              type="number"
              step="10"
              min="10"
              [(ngModel)]="settings.totalBudget"
              class="pwa-input"
              style="font-weight: 700;"
            />
          </div>

          <!-- Asset Classes Split -->
          <div class="pwa-card pwa-card--subtle" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: var(--pwa-text-xs);">
              <span>Reparto por Clases de Activos</span>
              <span class="pwa-badge pwa-badge--info">Total: 100%</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="pwa-input-group">
                <label class="pwa-label">% Renta Variable (RV)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  [(ngModel)]="settings.equityPercentage"
                  (ngModelChange)="onEquityPercentageChange($event)"
                  class="pwa-input"
                />
              </div>

              <div class="pwa-input-group">
                <label class="pwa-label">% Oro / Activo Refugio</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  [(ngModel)]="settings.safeHavenPercentage"
                  (ngModelChange)="onSafeHavenPercentageChange($event)"
                  class="pwa-input"
                />
              </div>
            </div>
          </div>

          <!-- Equities Internal Split -->
          <div class="pwa-card pwa-card--subtle" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: var(--pwa-text-xs);">
              <span>Subdivisión de la Renta Variable</span>
              <span class="pwa-badge" style="background-color: rgba(99, 102, 241, 0.12); color: #6366f1;">50% Fija + 50% ATH</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="pwa-input-group">
                <label class="pwa-label">% Base Fija Estratégica</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  [(ngModel)]="settings.equityFixedBaseRatio"
                  (ngModelChange)="settings.equityDynamicRatio = 100 - settings.equityFixedBaseRatio"
                  class="pwa-input"
                />
              </div>

              <div class="pwa-input-group">
                <label class="pwa-label">% Bolsa Dinámica Extra (ATH)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  [(ngModel)]="settings.equityDynamicRatio"
                  (ngModelChange)="settings.equityFixedBaseRatio = 100 - settings.equityDynamicRatio"
                  class="pwa-input"
                />
              </div>
            </div>
          </div>

          <!-- Rounding Mode -->
          <div>
            <label class="pwa-label" style="margin-bottom: 0.5rem;">
              Algoritmo de Cuadre y Redondeo
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <button
                type="button"
                (click)="settings.roundingMode = 'exact_integer'"
                class="pwa-card pwa-card--interactive"
                [style.border-color]="settings.roundingMode === 'exact_integer' ? 'var(--pwa-brand-500)' : 'var(--pwa-border)'"
                [style.background-color]="settings.roundingMode === 'exact_integer' ? 'var(--pwa-brand-soft)' : 'var(--pwa-bg-card)'"
                style="text-align: left;"
              >
                <div style="font-weight: 700; font-size: var(--pwa-text-xs);">Enteros (€ exactos)</div>
                <div style="font-size: var(--pwa-text-2xs); color: var(--pwa-text-secondary); margin-top: 0.25rem;">
                  Hare-Niemeyer sin fracciones sueltas
                </div>
              </button>

              <button
                type="button"
                (click)="settings.roundingMode = 'exact_cents'"
                class="pwa-card pwa-card--interactive"
                [style.border-color]="settings.roundingMode === 'exact_cents' ? 'var(--pwa-brand-500)' : 'var(--pwa-border)'"
                [style.background-color]="settings.roundingMode === 'exact_cents' ? 'var(--pwa-brand-soft)' : 'var(--pwa-bg-card)'"
                style="text-align: left;"
              >
                <div style="font-weight: 700; font-size: var(--pwa-text-xs);">Céntimos (2 decimales)</div>
                <div style="font-size: var(--pwa-text-2xs); color: var(--pwa-text-secondary); margin-top: 0.25rem;">
                  Cuadre centesimal exacto al 0,00 €
                </div>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: API INTEGRATION -->
      @if (activeTab() === 'api') {
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label class="pwa-label" style="margin-bottom: 0.5rem;">
              Proveedor de Datos de Mercado
            </label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem;">
              <button
                type="button"
                (click)="settings.apiSettings.provider = 'yahoo_cors'"
                class="pwa-btn pwa-btn--sm"
                [ngClass]="settings.apiSettings.provider === 'yahoo_cors' ? 'pwa-btn--primary' : 'pwa-btn--secondary'"
              >
                Yahoo (CORS)
              </button>
              <button
                type="button"
                (click)="settings.apiSettings.provider = 'fmp'"
                class="pwa-btn pwa-btn--sm"
                [ngClass]="settings.apiSettings.provider === 'fmp' ? 'pwa-btn--primary' : 'pwa-btn--secondary'"
              >
                FMP
              </button>
              <button
                type="button"
                (click)="settings.apiSettings.provider = 'alphavantage'"
                class="pwa-btn pwa-btn--sm"
                [ngClass]="settings.apiSettings.provider === 'alphavantage' ? 'pwa-btn--primary' : 'pwa-btn--secondary'"
              >
                Alpha Vantage
              </button>
              <button
                type="button"
                (click)="settings.apiSettings.provider = 'custom_proxy'"
                class="pwa-btn pwa-btn--sm"
                [ngClass]="settings.apiSettings.provider === 'custom_proxy' ? 'pwa-btn--primary' : 'pwa-btn--secondary'"
              >
                Proxy Propio
              </button>
            </div>
          </div>

          @if (settings.apiSettings.provider === 'yahoo_cors') {
            <div class="pwa-input-group">
              <label class="pwa-label">URL del Proxy CORS</label>
              <input
                type="text"
                [(ngModel)]="settings.apiSettings.corsProxyUrl"
                placeholder="https://api.allorigins.win/raw?url="
                class="pwa-input"
                style="font-family: var(--pwa-font-mono); font-size: var(--pwa-text-xs);"
              />
              <span class="pwa-hint">Permite realizar peticiones directas desde GitHub Pages a Yahoo Finance sin bloqueos CORS.</span>
            </div>
          }

          @if (settings.apiSettings.provider === 'fmp' || settings.apiSettings.provider === 'alphavantage') {
            <div class="pwa-input-group">
              <label class="pwa-label">Clave de API Personal (API Key)</label>
              <input
                type="password"
                [(ngModel)]="settings.apiSettings.apiKey"
                placeholder="Tu clave privada de la API"
                class="pwa-input"
                style="font-family: var(--pwa-font-mono); font-size: var(--pwa-text-xs);"
              />
              <span class="pwa-hint">Se almacena de forma 100% segura únicamente en tu navegador (localStorage).</span>
            </div>
          }

          @if (settings.apiSettings.provider === 'custom_proxy') {
            <div class="pwa-input-group">
              <label class="pwa-label">Plantilla de Endpoint / URL Proxy</label>
              <input
                type="text"
                [(ngModel)]="settings.apiSettings.customProxyUrlTemplate"
                placeholder="https://tu-worker.dev/quote?ticker={ticker}&isin={isin}"
                class="pwa-input"
                style="font-family: var(--pwa-font-mono); font-size: var(--pwa-text-xs);"
              />
              <span class="pwa-hint">Usa <code>&#123;ticker&#125;</code> e <code>&#123;isin&#125;</code> como variables.</span>
            </div>
          }
        </div>
      }

      <!-- TAB 3: BACKUP & DATA -->
      @if (activeTab() === 'backup') {
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="pwa-card pwa-card--subtle">
            <h4 style="font-size: var(--pwa-text-xs); font-weight: 700; margin: 0 0 0.25rem 0;">
              Copia de Seguridad Portátil (JSON)
            </h4>
            <p style="font-size: var(--pwa-text-xs); color: var(--pwa-text-secondary); margin: 0 0 0.75rem 0;">
              Exporta o restaura tus fondos, ponderaciones, multiplicadores y configuración sin depender de ningún servidor.
            </p>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button
                type="button"
                (click)="exportData()"
                class="pwa-btn pwa-btn--primary pwa-btn--sm"
              >
                <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Exportar Configuración (JSON)</span>
              </button>

              <label class="pwa-btn pwa-btn--secondary pwa-btn--sm" style="cursor: pointer;">
                <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span>Importar Copia (JSON)</span>
                <input type="file" accept=".json" (change)="onFileSelected($event)" style="display: none;" />
              </label>
            </div>
          </div>

          <div class="pwa-card" style="border-color: rgba(244, 63, 94, 0.3); background-color: var(--pwa-danger-soft);">
            <h4 style="font-size: var(--pwa-text-xs); font-weight: 700; color: var(--pwa-danger-text); margin: 0 0 0.25rem 0;">
              Restablecer Valores Iniciales
            </h4>
            <p style="font-size: var(--pwa-text-xs); color: var(--pwa-danger-text); margin: 0 0 0.75rem 0;">
              Borra los datos actuales y carga los fondos y configuración de ejemplo predeterminados.
            </p>
            <button
              type="button"
              (click)="resetDefaults()"
              class="pwa-btn pwa-btn--danger pwa-btn--sm"
            >
              Restablecer Valores de Fábrica
            </button>
          </div>
        </div>
      }

      <!-- Footer Actions Slot -->
      <div modal-footer style="display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; width: 100%;">
        <button
          type="button"
          (click)="close.emit()"
          class="pwa-btn pwa-btn--secondary"
        >
          Cerrar
        </button>
        <button
          type="button"
          (click)="saveSettings()"
          class="pwa-btn pwa-btn--primary"
        >
          Guardar Configuración
        </button>
      </div>
    </pwa-modal>
  `,
})
export class SettingsModalComponent {
  private readonly storage = inject(StorageService);
  private readonly toast = inject(PwaToastService);

  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();

  readonly activeTab = signal<'strategy' | 'api' | 'backup'>('strategy');

  settings: PortfolioSettings = { ...this.storage.settings() };

  constructor() {
    this.settings = { ...this.storage.settings() };
  }

  onEquityPercentageChange(val: number): void {
    const num = Number(val) || 0;
    this.settings.safeHavenPercentage = Math.max(0, 100 - num);
  }

  onSafeHavenPercentageChange(val: number): void {
    const num = Number(val) || 0;
    this.settings.equityPercentage = Math.max(0, 100 - num);
  }

  saveSettings(): void {
    this.storage.updateSettings(this.settings);
    this.toast.success('Configuración guardada', 'Los nuevos parámetros han sido aplicados.');
    this.close.emit();
  }

  exportData(): void {
    this.storage.exportBackup();
    this.toast.success('Copia generada', 'Archivo JSON descargado correctamente.');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const res = this.storage.importBackup(content);
      if (res.success) {
        this.settings = { ...this.storage.settings() };
        this.toast.success('Restauración completada', res.message);
      } else {
        this.toast.error('Error al importar', res.message);
      }
    };

    reader.readAsText(file);
    input.value = '';
  }

  resetDefaults(): void {
    if (confirm('¿Restablecer cartera y parámetros por defecto? Se perderán las modificaciones locales.')) {
      this.storage.resetToDefaults();
      this.settings = { ...this.storage.settings() };
      this.toast.info('Valores restablecidos', 'Se han restaurado los activos de ejemplo.');
    }
  }
}
