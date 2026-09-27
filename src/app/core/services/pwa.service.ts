import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private readonly swUpdate = inject(SwUpdate, { optional: true });

  readonly isOnline = signal<boolean>(navigator.onLine);
  readonly canInstall = signal<boolean>(false);
  readonly hasUpdate = signal<boolean>(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    this.registerConnectivityListeners();
    this.registerInstallPromptListener();
    this.registerUpdateListener();
  }

  private registerConnectivityListeners(): void {
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  private registerInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.deferredPrompt = null;
    });
  }

  private registerUpdateListener(): void {
    if (this.swUpdate && this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.hasUpdate.set(true);
        });
    }
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }
    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.canInstall.set(false);
    this.deferredPrompt = null;
    return choice.outcome === 'accepted';
  }

  reloadForUpdate(): void {
    if (this.swUpdate) {
      this.swUpdate.activateUpdate().then(() => document.location.reload());
    } else {
      document.location.reload();
    }
  }
}
