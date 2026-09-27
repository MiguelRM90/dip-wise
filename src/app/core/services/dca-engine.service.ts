import { Injectable, inject, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { Asset } from '../models/asset.model';
import {
  AssetAllocation,
  PortfolioSummary,
  PortfolioSettings,
} from '../models/portfolio.model';

@Injectable({
  providedIn: 'root',
})
export class DcaEngineService {
  private readonly storage = inject(StorageService);

  readonly assets = this.storage.assets;
  readonly settings = this.storage.settings;

  /**
   * Main reactive signal computing the tactical allocation and balance KPIs
   */
  readonly summary = computed<PortfolioSummary>(() => {
    const assets = this.assets();
    const settings = this.settings();
    return this.calculateAllocations(assets, settings);
  });

  /**
   * Calculate points based on drawdown bracket from ATH.
   * Corrected bracket rules:
   * - Drawdown <= 0%: 0 pts (at ATH)
   * - 0% to 5%: 1 pt
   * - 5% to 10%: 15 pts
   * - 10% to 15%: 17 pts
   * - 15% to 20%: 20 pts
   * - 20% to 25%: 25 pts
   * - 25% to 30%: 35 pts
   * - 30% to 35%: 50 pts
   * - > 35%: 75 pts
   */
  calculatePoints(drawdownPercentage: number): number {
    if (drawdownPercentage <= 0) return 0;
    if (drawdownPercentage <= 5) return 1;
    if (drawdownPercentage <= 10) return 15;
    if (drawdownPercentage <= 15) return 17;
    if (drawdownPercentage <= 20) return 20;
    if (drawdownPercentage <= 25) return 25;
    if (drawdownPercentage <= 30) return 35;
    if (drawdownPercentage <= 35) return 50;
    return 75;
  }

  /**
   * Computes the drawdown percentage from ATH.
   * Formula: ((ATH - Current Price) / ATH) * 100
   */
  calculateDrawdown(currentPrice: number, athPrice: number): number {
    if (athPrice <= 0) return 0;
    const diff = athPrice - currentPrice;
    const drawdown = (diff / athPrice) * 100;
    return Math.round(drawdown * 100) / 100;
  }

  /**
   * Core algorithm distributing fixed and dynamic pools with exact balancing.
   */
  calculateAllocations(assets: Asset[], settings: PortfolioSettings): PortfolioSummary {
    const totalBudget = Math.max(0, settings.totalBudget);

    if (assets.length === 0 || totalBudget <= 0) {
      return {
        totalBudget,
        allocatedBudget: 0,
        unallocatedRemainder: 0,
        isExactMatch: true,
        equityBudget: 0,
        equityAllocated: 0,
        safeHavenBudget: 0,
        safeHavenAllocated: 0,
        allocations: [],
      };
    }

    const equityBudget = totalBudget * (settings.equityPercentage / 100);
    const safeHavenBudget = totalBudget * (settings.safeHavenPercentage / 100);

    const fixedEquityPool = equityBudget * (settings.equityFixedBaseRatio / 100);
    const dynamicEquityPool = equityBudget * (settings.equityDynamicRatio / 100);

    const equityAssets = assets.filter((a) => a.category === 'equity');
    const safeHavenAssets = assets.filter((a) => a.category === 'safe_haven');

    // Equities: Sum of base weights
    const equityBaseWeightSum = equityAssets.reduce(
      (acc, a) => acc + Math.max(0, a.baseWeightPercentage),
      0
    );

    // Compute drawdowns, points, and dynamic weighted points for equities
    const equityIntermediate = equityAssets.map((asset) => {
      const drawdown = this.calculateDrawdown(asset.currentPrice, asset.athPrice);
      const points = this.calculatePoints(drawdown);
      const multiplier = Math.max(0, asset.dynamicMultiplier || 1);
      const weightedValue = points * multiplier;

      const baseShare =
        equityBaseWeightSum > 0
          ? Math.max(0, asset.baseWeightPercentage) / equityBaseWeightSum
          : 1 / Math.max(1, equityAssets.length);

      const baseAllocation = fixedEquityPool * baseShare;

      return {
        asset,
        drawdown,
        points,
        weightedValue,
        baseShare,
        baseAllocation,
      };
    });

    const totalWeightedPoints = equityIntermediate.reduce(
      (acc, item) => acc + item.weightedValue,
      0
    );

    // Compute extra allocation from dynamic pool for equities
    const equityCalculated = equityIntermediate.map((item) => {
      let dynamicPoolPercentage = 0;
      let extraAllocation = 0;

      if (totalWeightedPoints > 0) {
        dynamicPoolPercentage = (item.weightedValue / totalWeightedPoints) * 100;
        extraAllocation = dynamicEquityPool * (dynamicPoolPercentage / 100);
      } else {
        // Fallback: If all equities are at ATH (points = 0), distribute dynamic pool by strategic base weight
        dynamicPoolPercentage = item.baseShare * 100;
        extraAllocation = dynamicEquityPool * item.baseShare;
      }

      const theoreticalAllocation = item.baseAllocation + extraAllocation;

      return {
        asset: item.asset,
        drawdownPercentage: item.drawdown,
        points: item.points,
        weightedValue: item.weightedValue,
        dynamicPoolPercentage: Math.round(dynamicPoolPercentage * 100) / 100,
        baseAllocation: item.baseAllocation,
        extraAllocation,
        theoreticalAllocation,
      };
    });

    // Safe Haven: Sum of base weights
    const safeHavenBaseWeightSum = safeHavenAssets.reduce(
      (acc, a) => acc + Math.max(0, a.baseWeightPercentage),
      0
    );

    const safeHavenCalculated = safeHavenAssets.map((asset) => {
      const drawdown = this.calculateDrawdown(asset.currentPrice, asset.athPrice);
      const points = this.calculatePoints(drawdown);

      const baseShare =
        safeHavenBaseWeightSum > 0
          ? Math.max(0, asset.baseWeightPercentage) / safeHavenBaseWeightSum
          : 1 / Math.max(1, safeHavenAssets.length);

      const baseAllocation = safeHavenBudget * baseShare;

      return {
        asset,
        drawdownPercentage: drawdown,
        points,
        weightedValue: 0,
        dynamicPoolPercentage: 0,
        baseAllocation,
        extraAllocation: 0,
        theoreticalAllocation: baseAllocation,
      };
    });

    const allTheoretical = [...equityCalculated, ...safeHavenCalculated];

    // Largest Remainder Method (Hare-Niemeyer Algorithm) for Exact Budget Matching
    const isIntegerMode = settings.roundingMode === 'exact_integer';
    const multiplier = isIntegerMode ? 1 : 100;
    const targetUnits = Math.round(totalBudget * multiplier);

    interface RemainderItem {
      index: number;
      lowerUnits: number;
      remainder: number;
      theoretical: number;
    }

    const items: RemainderItem[] = allTheoretical.map((item, index) => {
      const units = item.theoreticalAllocation * multiplier;
      const lowerUnits = Math.floor(units);
      const remainder = units - lowerUnits;
      return {
        index,
        lowerUnits,
        remainder,
        theoretical: item.theoreticalAllocation,
      };
    });

    const currentUnitsSum = items.reduce((acc, it) => acc + it.lowerUnits, 0);
    const deficitUnits = targetUnits - currentUnitsSum;

    // Distribute remainder units to highest fractional remainder items
    const sortedByRemainder = [...items].sort((a, b) => {
      if (Math.abs(b.remainder - a.remainder) > 0.000001) {
        return b.remainder - a.remainder;
      }
      return b.theoretical - a.theoretical;
    });

    const finalAllocationsMap = new Map<number, number>();

    items.forEach((it) => {
      finalAllocationsMap.set(it.index, it.lowerUnits);
    });

    if (deficitUnits > 0) {
      for (let i = 0; i < deficitUnits && i < sortedByRemainder.length; i++) {
        const idx = sortedByRemainder[i].index;
        const currentVal = finalAllocationsMap.get(idx) ?? 0;
        finalAllocationsMap.set(idx, currentVal + 1);
      }
    } else if (deficitUnits < 0) {
      // Over-allocated edge case: deduct 1 from items with smallest remainder and >0 units
      const sortedAsc = [...sortedByRemainder].reverse();
      let toDeduct = Math.abs(deficitUnits);
      for (let i = 0; i < sortedAsc.length && toDeduct > 0; i++) {
        const idx = sortedAsc[i].index;
        const currentVal = finalAllocationsMap.get(idx) ?? 0;
        if (currentVal > 0) {
          finalAllocationsMap.set(idx, currentVal - 1);
          toDeduct--;
        }
      }
    }

    const allocations: AssetAllocation[] = allTheoretical.map((item, index) => {
      const finalUnits = finalAllocationsMap.get(index) ?? 0;
      const finalAllocation = finalUnits / multiplier;
      const portfolioWeightPercentage =
        totalBudget > 0 ? (finalAllocation / totalBudget) * 100 : 0;

      return {
        ...item,
        finalAllocation,
        portfolioWeightPercentage: Math.round(portfolioWeightPercentage * 100) / 100,
      };
    });

    const allocatedBudget = allocations.reduce((acc, a) => acc + a.finalAllocation, 0);
    const roundedAllocated = Math.round(allocatedBudget * 100) / 100;
    const roundedTarget = Math.round(totalBudget * 100) / 100;
    const unallocatedRemainder = Math.round((roundedTarget - roundedAllocated) * 100) / 100;

    const equityAllocated = allocations
      .filter((a) => a.asset.category === 'equity')
      .reduce((acc, a) => acc + a.finalAllocation, 0);

    const safeHavenAllocated = allocations
      .filter((a) => a.asset.category === 'safe_haven')
      .reduce((acc, a) => acc + a.finalAllocation, 0);

    return {
      totalBudget: roundedTarget,
      allocatedBudget: roundedAllocated,
      unallocatedRemainder,
      isExactMatch: Math.abs(unallocatedRemainder) < 0.0001,
      equityBudget: Math.round(equityBudget * 100) / 100,
      equityAllocated: Math.round(equityAllocated * 100) / 100,
      safeHavenBudget: Math.round(safeHavenBudget * 100) / 100,
      safeHavenAllocated: Math.round(safeHavenAllocated * 100) / 100,
      allocations,
    };
  }
}
