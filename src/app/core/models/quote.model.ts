export interface QuoteFetchResult {
  isin: string;
  ticker: string;
  price?: number;
  ath?: number;
  name?: string;
  currency?: string;
  success: boolean;
  error?: string;
}

export interface YahooChartResponse {
  chart: {
    result?: Array<{
      meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        fiftyTwoWeekHigh?: number;
        shortName?: string;
        longName?: string;
      };
      indicators?: {
        quote?: Array<{
          high?: Array<number | null>;
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      code: string;
      description: string;
    } | null;
  };
}
