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

  describe('calculatePoints (Momentum & Drawdown Rules)', () => {
    it('should assign 16 points for Zona Máximos / Momentum (drawdown <= 2.0%)', () => {
      expect(service.calculatePoints(-1.0)).toBe(16);
      expect(service.calculatePoints(0)).toBe(16);
      expect(service.calculatePoints(1.2)).toBe(16);
      expect(service.calculatePoints(2.0)).toBe(16);
    });

    it('should assign 4 points for Ruido / Consolidación leve (2.0% < drawdown <= 5.0%)', () => {
      expect(service.calculatePoints(2.1)).toBe(4);
      expect(service.calculatePoints(4.0)).toBe(4);
      expect(service.calculatePoints(5.0)).toBe(4);
    });

    it('should assign 15 points for Corrección inicial (5.0% < drawdown <= 10.0%)', () => {
      expect(service.calculatePoints(5.1)).toBe(15);
      expect(service.calculatePoints(10.0)).toBe(15);
    });

    it('should assign 17 points for Corrección técnica (10.0% < drawdown <= 15.0%)', () => {
      expect(service.calculatePoints(10.1)).toBe(17);
      expect(service.calculatePoints(15.0)).toBe(17);
    });

    it('should assign 20 points for Corrección media (15.0% < drawdown <= 20.0%)', () => {
      expect(service.calculatePoints(15.1)).toBe(20);
      expect(service.calculatePoints(20.0)).toBe(20);
    });

    it('should assign 25-75 points for Mercado bajista / Oportunidad (drawdown > 20.0%)', () => {
      expect(service.calculatePoints(20.1)).toBe(25);
      expect(service.calculatePoints(25.0)).toBe(25);
      expect(service.calculatePoints(25.1)).toBe(35);
      expect(service.calculatePoints(30.0)).toBe(35);
      expect(service.calculatePoints(30.1)).toBe(50);
      expect(service.calculatePoints(35.0)).toBe(50);
      expect(service.calculatePoints(35.1)).toBe(75);
      expect(service.calculatePoints(50.0)).toBe(75);
    });
  });

  describe('getTramoInfo', () => {
    it('should return Momentum tramo for drawdown <= 2.0%', () => {
      const info = service.getTramoInfo(1.0);
      expect(info.badge).toBe('Momentum');
      expect(info.icon).toBe('🚀');
    });

    it('should return Consolidación tramo for drawdown between 2% and 5%', () => {
      const info = service.getTramoInfo(3.5);
      expect(info.name).toBe('Consolidación (entre 2% y 5%)');
      expect(info.badge).toBe('Consolidación');
      expect(info.icon).toBe('⚖️');
    });

    it('should return specific tramo for drawdown between 20% and 25%', () => {
      const info = service.getTramoInfo(22.0);
      expect(info.name).toBe('Entre 20% y 25%');
      expect(info.badge).toBe('Caída 20-25%');
      expect(info.icon).toBe('💎');
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
        name: 'Equity 1 (At ATH)',
        category: 'equity',
        baseWeightPercentage: 50,
        dynamicMultiplier: 10,
        currentPrice: 100,
        athPrice: 100,
      },
      {
        id: '2',
        isin: 'LU2',
        ticker: 'EQ2',
        name: 'Equity 2 (15% drop)',
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
        name: 'Equity 3 (3% drop)',
        category: 'equity',
        baseWeightPercentage: 20,
        dynamicMultiplier: 4,
        currentPrice: 97,
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

      // Verify that EQ1 receives momentum points (16 pts) and extra allocation even at ATH!
      const eq1Alloc = summary.allocations.find((a) => a.asset.ticker === 'EQ1');
      expect(eq1Alloc).toBeDefined();
      expect(eq1Alloc?.points).toBe(16);
      expect(eq1Alloc?.extraAllocation).toBeGreaterThan(0);
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
