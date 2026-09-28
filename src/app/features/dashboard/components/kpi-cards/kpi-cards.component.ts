import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DcaEngineService } from '../../../../core/services/dca-engine.service';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    @let s = dcaEngine.summary();
    @let cfg = dcaEngine.settings();

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- KPI 1: Presupuesto Total -->
      <div class="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div class="absolute -right-3 -top-3 w-16 h-16 bg-sky-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Presupuesto Total
          </span>
          <span class="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div class="mt-3">
          <div class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {{ s.totalBudget | currency: 'EUR' : 'symbol' : '1.2-2' }}
          </div>
          <div class="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{{ s.allocations.length }} activos registrados</span>
            <span class="font-medium text-slate-700 dark:text-slate-300">Aportación periódica</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Renta Variable -->
      <div class="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div class="absolute -right-3 -top-3 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Renta Variable
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              {{ cfg.equityPercentage }}%
            </span>
          </div>
          <span class="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
        </div>
        <div class="mt-3">
          <div class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {{ s.equityAllocated | currency: 'EUR' : 'symbol' : '1.2-2' }}
          </div>
          <div class="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Fijo: {{ (s.equityBudget * (cfg.equityFixedBaseRatio / 100)) | currency: 'EUR' : 'symbol' : '1.0-0' }}</span>
            <span class="text-indigo-600 dark:text-indigo-400 font-medium">
              Bolsa ATH: {{ (s.equityBudget * (cfg.equityDynamicRatio / 100)) | currency: 'EUR' : 'symbol' : '1.0-0' }}
            </span>
          </div>
        </div>
      </div>

      <!-- KPI 3: Oro / Refugio -->
      <div class="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div class="absolute -right-3 -top-3 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Oro / Refugio
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
              {{ cfg.safeHavenPercentage }}%
            </span>
          </div>
          <span class="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
        </div>
        <div class="mt-3">
          <div class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {{ s.safeHavenAllocated | currency: 'EUR' : 'symbol' : '1.2-2' }}
          </div>
          <div class="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Objetivo: {{ s.safeHavenBudget | currency: 'EUR' : 'symbol' : '1.2-2' }}</span>
            <span class="text-amber-600 dark:text-amber-400 font-medium">Asignación Directa</span>
          </div>
        </div>
      </div>

      <!-- KPI 4: Control de Cuadre Exacto -->
      <div
        class="rounded-2xl p-4 sm:p-5 border shadow-sm relative overflow-hidden transition-all"
        [ngClass]="
          s.isExactMatch
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60'
            : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300/80 dark:border-rose-800/60'
        "
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider" [ngClass]="s.isExactMatch ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'">
            Estado de Cuadre
          </span>
          <span
            class="p-2 rounded-xl"
            [ngClass]="s.isExactMatch ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'"
          >
            @if (s.isExactMatch) {
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            } @else {
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          </span>
        </div>
        <div class="mt-3">
          <div class="text-lg font-black tracking-tight" [ngClass]="s.isExactMatch ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'">
            {{ s.isExactMatch ? '✓ Cuadrado exacto' : 'Desajuste detectado' }}
          </div>
          <div class="mt-1 flex items-center justify-between text-xs" [ngClass]="s.isExactMatch ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'">
            <span>Diferencia: {{ s.unallocatedRemainder | currency: 'EUR' : 'symbol' : '1.2-2' }}</span>
            <span class="font-medium text-[11px] px-1.5 py-0.5 rounded" [ngClass]="s.isExactMatch ? 'bg-emerald-200/50 dark:bg-emerald-900/50' : 'bg-rose-200/50 dark:bg-rose-900/50'">
              {{ cfg.roundingMode === 'exact_integer' ? 'Hare-Niemeyer (€)' : 'Céntimos exactos' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class KpiCardsComponent {
  readonly dcaEngine = inject(DcaEngineService);
}
