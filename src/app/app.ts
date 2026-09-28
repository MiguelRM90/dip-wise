import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/header/header.component';
import { PwaToastContainerComponent } from 'pwa-ui-core/components';
import { KpiCardsComponent } from './features/dashboard/components/kpi-cards/kpi-cards.component';
import { AllocationTableComponent } from './features/dashboard/components/allocation-table/allocation-table.component';
import { AllocationChartComponent } from './features/dashboard/components/allocation-chart/allocation-chart.component';
import { AssetModalComponent } from './features/assets/components/asset-modal/asset-modal.component';
import { SettingsModalComponent } from './features/settings/components/settings-modal/settings-modal.component';
import { Asset } from './core/models/asset.model';

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
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
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
