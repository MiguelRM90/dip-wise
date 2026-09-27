import { TestBed } from '@angular/core/testing';
import { DcaEngineService } from './dca-engine.service';
import { StorageService } from './storage.service';
import { PortfolioSettings } from '../models/portfolio.model';
import { Asset } from '../models/asset.model';

describe('DcaEngineService', () => {
  let service: DcaEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DcaEngineService, StorageService],
    });
    service = TestBed.inject(DcaEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculatePoints (ATH Discount Bracket Rules)', () => {
    it('should assign 0 points at or above ATH (drawdown <= 0%)', () => {
      expect(service.calculatePoints(0)).toBe(0);
      expect(service.calculatePoints(-2.5)).toBe(0);
    });

    it('should assign 1 point for drawdown between 0% and 5%', () => {
      expect(service.calculatePoints(0.5)).toBe(1);
      expect(service.calculatePoints(5.0)).toBe(1);
    });

    it('should assign 15 points for drawdown between 5% and 10%', () => {
      expect(service.calculatePoints(5.1)).toBe(15);
      expect(service.calculatePoints(10.0)).toBe(15);
    });

    it('should assign 17 points for drawdown between 10% and 15%', () => {
      expect(service.calculatePoints(10.1)).toBe(17);
      expect(service.calculatePoints(15.0)).toBe(17);
    });

    it('should assign 20 points for drawdown between 15% and 20%', () => {
      expect(service.calculatePoints(15.1)).toBe(20);
      expect(service.calculatePoints(20.0)).toBe(20);
    });

    it('should assign 25 points for drawdown between 20% and 25%', () => {
      expect(service.calculatePoints(20.1)).toBe(25);
      expect(service.calculatePoints(25.0)).toBe(25);
    });

    it('should assign 35 points for drawdown between 25% and 30%', () => {
      expect(service.calculatePoints(25.1)).toBe(35);
      expect(service.calculatePoints(30.0)).toBe(35);
    });

    it('should assign 50 points for drawdown between 30% and 35%', () => {
      expect(service.calculatePoints(30.1)).toBe(50);
      expect(service.calculatePoints(35.0)).toBe(50);
    });

    it('should assign 75 points for drawdown greater than 35%', () => {
      expect(service.calculatePoints(35.1)).toBe(75);
      expect(service.calculatePoints(50)).toBe(75);
    });
  });

  describe('calculateDrawdown', () => {
    it('should correctly calculate percentage drop from ATH', () => {
      expect(service.calculateDrawdown(90, 100)).toBe(10);
      expect(service.calculateDrawdown(80, 100)).toBe(20);
      expect(service.calculateDrawdown(100, 100)).toBe(0);
    });

    it('should return 0 when ATH is 0 or invalid', () => {
      expect(service.calculateDrawdown(50, 0)).toBe(0);
    });
  });

  describe('Hare-Niemeyer Exact Balancing Algorithm', () => {
    const mockSettings: PortfolioSettings = {
      totalBudget: 600,
      equityPercentage: 90,
      safeHavenPercentage: 10,
      equityFixedBaseRatio: 50,
      equityDynamicRatio: 50,
      roundingMode: 'exact_integer',
      apiSettings: {
        provider: 'yahoo_cors',
        apiKey: '',
        corsProxyUrl: '',
        customProxyUrlTemplate: '',
      },
    };

    const mockAssets: Asset[] = [
      {
        id: '1',
        isin: 'LU1',
        ticker: 'EQ1',
        name: 'Equity 1',
        category: 'equity',
        baseWeightPercentage: 50,
        dynamicMultiplier: 10,
        currentPrice: 90,
        athPrice: 100,
      },
      {
        id: '2',
        isin: 'LU2',
        ticker: 'EQ2',
        name: 'Equity 2',
        category: 'equity',
        baseWeightPercentage: 30,
        dynamicMultiplier: 6,
        currentPrice: 85,
        athPrice: 100,
      },
      {
        id: '3',
        isin: 'LU3',
        ticker: 'EQ3',
        name: 'Equity 3',
        category: 'equity',
        baseWeightPercentage: 20,
        dynamicMultiplier: 4,
        currentPrice: 95,
        athPrice: 100,
      },
      {
        id: '4',
        isin: 'LU4',
        ticker: 'GOLD',
        name: 'Physical Gold',
        category: 'safe_haven',
        baseWeightPercentage: 100,
        dynamicMultiplier: 1,
        currentPrice: 50,
        athPrice: 50,
      },
    ];

    it('should guarantee sum of rounded allocations matches totalBudget EXACTLY', () => {
      const summary = service.calculateAllocations(mockAssets, mockSettings);

      expect(summary.totalBudget).toBe(600);
      expect(summary.allocatedBudget).toBe(600);
      expect(summary.unallocatedRemainder).toBe(0);
      expect(summary.isExactMatch).toBe(true);

      const sum = summary.allocations.reduce((acc, a) => acc + a.finalAllocation, 0);
      expect(sum).toBe(600);
    });

    it('should work with arbitrary non-round budgets without losing cents or units', () => {
      const oddSettings: PortfolioSettings = {
        ...mockSettings,
        totalBudget: 733.0,
      };

      const summary = service.calculateAllocations(mockAssets, oddSettings);
      expect(summary.allocatedBudget).toBe(733);
      expect(summary.unallocatedRemainder).toBe(0);
      expect(summary.isExactMatch).toBe(true);
    });

    it('should support exact 2-decimal cents mode without discrepancy', () => {
      const centsSettings: PortfolioSettings = {
        ...mockSettings,
        totalBudget: 600.0,
        roundingMode: 'exact_cents',
      };

      const summary = service.calculateAllocations(mockAssets, centsSettings);
      expect(summary.allocatedBudget).toBe(600.0);
      expect(summary.unallocatedRemainder).toBe(0);
      expect(summary.isExactMatch).toBe(true);
    });
  });
});
