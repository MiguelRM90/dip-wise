import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { AssetAllocation, DcaEngineService } from '../../../../core';

interface ChartSlice {
  allocation: AssetAllocation;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
  percentage: number;
}

const COLOR_PALETTE = [
  '#0284c7', // sky-600
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // purple-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

@Component({
  selector: 'app-allocation-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './allocation-chart.component.html',
  styleUrl: './allocation-chart.component.css',
})
export class AllocationChartComponent {
  readonly dcaEngine = inject(DcaEngineService);
  readonly hoveredAssetId = signal<string | null>(null);

  readonly slices = computed<ChartSlice[]>(() => {
    const summary = this.dcaEngine.summary();
    const allocations = summary.allocations;
    const total = summary.allocatedBudget;

    if (total <= 0 || allocations.length === 0) {
      return [];
    }

    const circumference = 2 * Math.PI * 38; // r = 38 => ~238.76
    const gap = allocations.length > 1 ? 1.5 : 0;
    let accumulatedLength = 0;

    return allocations.map((allocation, index) => {
      const percentage = (allocation.finalAllocation / total) * 100;
      const rawLength = (allocation.finalAllocation / total) * circumference;
      const sliceLength = allocation.finalAllocation > 0 ? Math.max(0.2, rawLength - gap) : 0;
      const strokeDasharray = `${sliceLength} ${circumference - sliceLength}`;
      const strokeDashoffset = -accumulatedLength;

      accumulatedLength += rawLength;

      return {
        allocation,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
        strokeDasharray,
        strokeDashoffset,
        percentage: Math.round(percentage * 10) / 10,
      };
    });
  });
}
