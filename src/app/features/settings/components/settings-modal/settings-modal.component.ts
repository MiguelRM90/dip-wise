import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PwaToastService } from 'pwa-ui-core/services';
import { PortfolioSettings, StorageService } from '../../../../core';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.component.html',
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
    if (
      confirm(
        '¿Restablecer cartera y parámetros por defecto? Se perderán las modificaciones locales.',
      )
    ) {
      this.storage.resetToDefaults();
      this.settings = { ...this.storage.settings() };
      this.toast.info('Valores restablecidos', 'Se han restaurado los activos de ejemplo.');
    }
  }
}
