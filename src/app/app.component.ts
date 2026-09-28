import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { PwaToastContainerComponent } from 'pwa-ui-core/components';
import { Asset } from './core';
import { AssetModalComponent } from './features/assets';
import {
  AllocationChartComponent,
  AllocationTableComponent,
  KpiCardsComponent,
} from './features/dashboard';
import { SettingsModalComponent } from './features/settings';
import { HeaderComponent } from './shared';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    PwaToastContainerComponent,
    KpiCardsComponent,
    AllocationTableComponent,
    AllocationChartComponent,
    AssetModalComponent,
    SettingsModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly isAssetModalOpen = signal<boolean>(false);
  readonly editingAsset = signal<Asset | null>(null);
  readonly isSettingsModalOpen = signal<boolean>(false);
  readonly showStrategyExplainer = signal<boolean>(false);

  openAddAssetModal(): void {
    this.editingAsset.set(null);
    this.isAssetModalOpen.set(true);
  }

  openEditAssetModal(asset: Asset): void {
    this.editingAsset.set(asset);
    this.isAssetModalOpen.set(true);
  }

  closeAssetModal(): void {
    this.isAssetModalOpen.set(false);
    this.editingAsset.set(null);
  }

  openSettingsModal(): void {
    this.isSettingsModalOpen.set(true);
  }

  closeSettingsModal(): void {
    this.isSettingsModalOpen.set(false);
  }
}
