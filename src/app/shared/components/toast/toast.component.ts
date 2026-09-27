import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto rounded-xl p-4 shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0"
          [ngClass]="getToastClasses(toast)"
        >
          <div class="flex items-start gap-3">
            <div class="mt-0.5 shrink-0">
              @if (toast.type === 'success') {
                <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              } @else if (toast.type === 'error') {
                <svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              } @else if (toast.type === 'warning') {
                <svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              } @else {
                <svg class="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            </div>

            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-slate-900 dark:text-white">{{ toast.title }}</h4>
              @if (toast.message) {
                <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-words">{{ toast.message }}</p>
              }
            </div>

            <button
              (click)="toastService.dismiss(toast.id)"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Close notification"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getToastClasses(toast: ToastMessage): Record<string, boolean> {
    return {
      'bg-white/95 dark:bg-slate-900/95 border-emerald-500/30 text-slate-900': toast.type === 'success',
      'bg-white/95 dark:bg-slate-900/95 border-rose-500/30 text-slate-900': toast.type === 'error',
      'bg-white/95 dark:bg-slate-900/95 border-amber-500/30 text-slate-900': toast.type === 'warning',
      'bg-white/95 dark:bg-slate-900/95 border-sky-500/30 text-slate-900': toast.type === 'info',
    };
  }
}
