import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(type: ToastType, title: string, message?: string, durationMs: number = 4000): void {
    const id = Math.random().toString(36).slice(2, 9);
    const toast: ToastMessage = { id, type, title, message, durationMs };

    this.toasts.update((current) => [...current, toast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  success(title: string, message?: string): void {
    this.show('success', title, message);
  }

  info(title: string, message?: string): void {
    this.show('info', title, message);
  }

  warning(title: string, message?: string): void {
    this.show('warning', title, message);
  }

  error(title: string, message?: string): void {
    this.show('error', title, message, 6000);
  }

  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
