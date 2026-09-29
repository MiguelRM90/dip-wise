export type AssetCategory = 'equity' | 'safe_haven';

export type QuoteStatus = 'idle' | 'loading' | 'success' | 'error';

export interface Asset {
  id: string;
  isin: string;
  ticker: string;
  name: string;
  category: AssetCategory;
  baseWeightPercentage: number;
  dynamicMultiplier?: number;
  currentPrice: number;
  athPrice: number;
  lastUpdated?: string;
  status?: QuoteStatus;
  statusMessage?: string;
}

export interface AssetFormData {
  isin: string;
  ticker: string;
  name: string;
  category: AssetCategory;
  baseWeightPercentage: number;
  currentPrice: number;
  athPrice: number;
}
