import { Asset } from './asset.model';

export type RoundingMode = 'exact_integer' | 'exact_cents';

export type QuoteProviderType = 'yahoo_cors' | 'fmp' | 'alphavantage' | 'custom_proxy';

export interface ApiSettings {
  provider: QuoteProviderType;
  apiKey: string;
  corsProxyUrl: string;
  customProxyUrlTemplate: string;
}

export interface PortfolioSettings {
  totalBudget: number;
  equityPercentage: number;
  safeHavenPercentage: number;
  equityFixedBaseRatio: number;
  equityDynamicRatio: number;
  roundingMode: RoundingMode;
  apiSettings: ApiSettings;
}

export interface TramoInfo {
  name: string;
  badge: string;
  icon: string;
  description: string;
}

export interface AssetAllocation {
  asset: Asset;
  drawdownPercentage: number;
  points: number;
  tramo: TramoInfo;
  weightedValue: number;
  dynamicPoolPercentage: number;
  baseAllocation: number;
  extraAllocation: number;
  theoreticalAllocation: number;
  finalAllocation: number;
  portfolioWeightPercentage: number;
}

export interface PortfolioSummary {
  totalBudget: number;
  allocatedBudget: number;
  unallocatedRemainder: number;
  isExactMatch: boolean;
  equityBudget: number;
  equityAllocated: number;
  safeHavenBudget: number;
  safeHavenAllocated: number;
  allocations: AssetAllocation[];
}

export const DEFAULT_PORTFOLIO_SETTINGS: PortfolioSettings = {
  totalBudget: 600,
  equityPercentage: 90,
  safeHavenPercentage: 10,
  equityFixedBaseRatio: 50,
  equityDynamicRatio: 50,
  roundingMode: 'exact_integer',
  apiSettings: {
    provider: 'yahoo_cors',
    apiKey: '',
    corsProxyUrl: 'https://api.allorigins.win/raw?url=',
    customProxyUrlTemplate: 'https://api.allorigins.win/raw?url=https%3A%2F%2Fquery1.finance.yahoo.com%2Fv8%2Ffinance%2Fchart%2F{ticker}%3Finterval%3D1d%26range%3D1y',
  },
};

export const DEFAULT_SEED_ASSETS: Asset[] = [
  {
    id: 'seed-equity-1',
    isin: 'IE00B4L5Y983',
    ticker: 'IWDA.AS',
    name: 'iShares Core MSCI World UCITS ETF',
    category: 'equity',
    baseWeightPercentage: 50,
    dynamicMultiplier: 10,
    currentPrice: 94.20,
    athPrice: 102.50,
    status: 'idle',
    statusMessage: 'Ready for market sync',
  },
  {
    id: 'seed-equity-2',
    isin: 'IE00B5BMR087',
    ticker: 'CSPX.AS',
    name: 'iShares Core S&P 500 UCITS ETF',
    category: 'equity',
    baseWeightPercentage: 30,
    dynamicMultiplier: 6,
    currentPrice: 548.60,
    athPrice: 575.00,
    status: 'idle',
    statusMessage: 'Ready for market sync',
  },
  {
    id: 'seed-equity-3',
    isin: 'IE00BKM4GZ66',
    ticker: 'EMIM.AS',
    name: 'iShares Core MSCI EM IMI UCITS ETF',
    category: 'equity',
    baseWeightPercentage: 20,
    dynamicMultiplier: 4,
    currentPrice: 32.40,
    athPrice: 39.80,
    status: 'idle',
    statusMessage: 'Ready for market sync',
  },
  {
    id: 'seed-gold-1',
    isin: 'IE00B4ND3602',
    ticker: 'SGLD.L',
    name: 'iShares Physical Gold ETC',
    category: 'safe_haven',
    baseWeightPercentage: 100,
    dynamicMultiplier: 1,
    currentPrice: 48.90,
    athPrice: 51.50,
    status: 'idle',
    statusMessage: 'Ready for market sync',
  },
];
