import { Injectable, signal, effect } from '@angular/core';
import { Asset } from '../models/asset.model';
import {
  PortfolioSettings,
  DEFAULT_PORTFOLIO_SETTINGS,
  DEFAULT_SEED_ASSETS,
} from '../models/portfolio.model';

const ASSETS_STORAGE_KEY = 'dipwise_assets';
const SETTINGS_STORAGE_KEY = 'dipwise_portfolio_settings';

export interface BackupData {
  version: number;
  exportedAt: string;
  settings: PortfolioSettings;
  assets: Asset[];
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  readonly assets = signal<Asset[]>(this.loadAssetsFromStorage());
  readonly settings = signal<PortfolioSettings>(this.loadSettingsFromStorage());

  constructor() {
    effect(() => {
      const currentAssets = this.assets();
      this.persistAssets(currentAssets);
    });

    effect(() => {
      const currentSettings = this.settings();
      this.persistSettings(currentSettings);
    });
  }

  private loadAssetsFromStorage(): Asset[] {
    try {
      const raw = localStorage.getItem(ASSETS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // LocalStorage access failed or invalid JSON
    }
    return [...DEFAULT_SEED_ASSETS];
  }

  private loadSettingsFromStorage(): PortfolioSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.totalBudget === 'number') {
          return {
            ...DEFAULT_PORTFOLIO_SETTINGS,
            ...parsed,
            apiSettings: {
              ...DEFAULT_PORTFOLIO_SETTINGS.apiSettings,
              ...(parsed.apiSettings || {}),
            },
          };
        }
      }
    } catch {
      // LocalStorage access failed or invalid JSON
    }
    return { ...DEFAULT_PORTFOLIO_SETTINGS };
  }

  private persistAssets(assets: Asset[]): void {
    try {
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  private persistSettings(settings: PortfolioSettings): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  saveAsset(asset: Asset): void {
    this.assets.update((current) => {
      const index = current.findIndex((a) => a.id === asset.id || (a.isin === asset.isin && a.isin.trim().length > 0));
      if (index >= 0) {
        const updated = [...current];
        updated[index] = { ...current[index], ...asset };
        return updated;
      }
      return [...current, asset];
    });
  }

  deleteAsset(id: string): void {
    this.assets.update((current) => current.filter((a) => a.id !== id));
  }

  updateInlinePrices(id: string, currentPrice: number, athPrice: number): void {
    this.assets.update((current) =>
      current.map((a) => (a.id === id ? { ...a, currentPrice, athPrice } : a))
    );
  }

  updateAssetStatus(id: string, status: Asset['status'], statusMessage?: string, lastUpdated?: string): void {
    this.assets.update((current) =>
      current.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              statusMessage: statusMessage ?? a.statusMessage,
              lastUpdated: lastUpdated ?? a.lastUpdated,
            }
          : a
      )
    );
  }

  updateSettings(newSettings: Partial<PortfolioSettings>): void {
    this.settings.update((current) => ({
      ...current,
      ...newSettings,
      apiSettings: {
        ...current.apiSettings,
        ...(newSettings.apiSettings || {}),
      },
    }));
  }

  exportBackup(): void {
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: this.settings(),
      assets: this.assets(),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dipwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString) as BackupData;
      if (!data || !Array.isArray(data.assets) || !data.settings) {
        return {
          success: false,
          message: 'Invalid backup structure: missing assets or settings.',
        };
      }

      this.settings.set({
        ...DEFAULT_PORTFOLIO_SETTINGS,
        ...data.settings,
        apiSettings: {
          ...DEFAULT_PORTFOLIO_SETTINGS.apiSettings,
          ...(data.settings.apiSettings || {}),
        },
      });

      this.assets.set(data.assets);

      return {
        success: true,
        message: `Successfully restored ${data.assets.length} assets and portfolio settings.`,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown parsing error';
      return {
        success: false,
        message: `Error importing backup: ${errorMessage}`,
      };
    }
  }

  resetToDefaults(): void {
    this.assets.set([...DEFAULT_SEED_ASSETS]);
    this.settings.set({ ...DEFAULT_PORTFOLIO_SETTINGS });
  }
}
