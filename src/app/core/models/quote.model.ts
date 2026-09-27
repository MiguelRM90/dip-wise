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

export interface YahooSearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  exchDisp?: string;
  typeDisp?: string;
  quoteType?: string;
}

export interface YahooSearchResponse {
  quotes?: YahooSearchQuote[];
  count?: number;
}

export interface ResolvedSymbolResult {
  symbol: string;
  name?: string;
  exchange?: string;
  quotes: YahooSearchQuote[];
}
