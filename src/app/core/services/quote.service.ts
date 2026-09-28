import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { StorageService } from './storage.service';
import { Asset } from '../models/asset.model';
import {
  QuoteFetchResult,
  YahooChartResponse,
  YahooSearchQuote,
  YahooSearchResponse,
  ResolvedSymbolResult,
} from '../models/quote.model';

@Injectable({
  providedIn: 'root',
})
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  readonly isUpdating = signal<boolean>(false);
  readonly lastSyncTimestamp = signal<string | null>(localStorage.getItem('dipwise_last_sync'));

  /**
   * Refreshes market quotes for all assets in the portfolio
   */
  async updateAllQuotes(): Promise<{ successCount: number; failureCount: number }> {
    const assets = this.storage.assets();
    if (assets.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    this.isUpdating.set(true);
    let successCount = 0;
    let failureCount = 0;

    for (const asset of assets) {
      this.storage.updateAssetStatus(asset.id, 'loading', 'Fetching live market quote...');
    }

    // Process concurrently with rate-limiting safety
    const results = await Promise.allSettled(assets.map((asset) => this.fetchQuoteForAsset(asset)));

    const nowIso = new Date().toISOString();

    results.forEach((res, index) => {
      const asset = assets[index];
      if (res.status === 'fulfilled' && res.value.success && res.value.price) {
        successCount++;
        const fetchedPrice = res.value.price;
        // Keep previous ATH if it was higher than the fetched 52w high, or use the higher one
        const newAth = Math.max(asset.athPrice || 0, res.value.ath || 0, fetchedPrice);

        this.storage.updateInlinePrices(asset.id, fetchedPrice, newAth);
        this.storage.updateAssetStatus(
          asset.id,
          'success',
          `Updated at ${new Date().toLocaleTimeString()}`,
          nowIso,
        );
      } else {
        failureCount++;
        const errorMsg = res.status === 'fulfilled' ? res.value.error : 'Network connection failed';
        this.storage.updateAssetStatus(
          asset.id,
          'error',
          errorMsg || 'Failed to fetch quote. Manual entry available.',
          nowIso,
        );
      }
    });

    this.lastSyncTimestamp.set(nowIso);
    try {
      localStorage.setItem('dipwise_last_sync', nowIso);
    } catch {
      // Storage failure ignore
    }

    this.isUpdating.set(false);
    return { successCount, failureCount };
  }

  /**
   * Updates quote for a single asset
   */
  async updateSingleAssetQuote(asset: Asset): Promise<QuoteFetchResult> {
    this.storage.updateAssetStatus(asset.id, 'loading', 'Fetching market quote...');
    const result = await this.fetchQuoteForAsset(asset);
    const nowIso = new Date().toISOString();

    if (result.success && result.price) {
      const newAth = Math.max(asset.athPrice || 0, result.ath || 0, result.price);
      this.storage.updateInlinePrices(asset.id, result.price, newAth);
      this.storage.updateAssetStatus(
        asset.id,
        'success',
        `Updated at ${new Date().toLocaleTimeString()}`,
        nowIso,
      );
    } else {
      this.storage.updateAssetStatus(
        asset.id,
        'error',
        result.error || 'Failed to fetch quote',
        nowIso,
      );
    }

    return result;
  }

  /**
   * Searches Yahoo Finance for symbols matching an ISIN or search query
   */
  async searchYahooSymbols(query: string): Promise<YahooSearchQuote[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const settings = this.storage.settings();
    const proxyBase = settings.apiSettings.corsProxyUrl || 'https://api.allorigins.win/raw?url=';
    const targetUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQuery)}&quotesCount=6&newsCount=0`;
    const requestUrl = `${proxyBase}${encodeURIComponent(targetUrl)}`;

    try {
      const response = await firstValueFrom(
        this.http.get<YahooSearchResponse>(requestUrl).pipe(timeout(10000)),
      );
      return response.quotes || [];
    } catch (err: unknown) {
      console.warn('Yahoo Finance search failed:', err);
      return [];
    }
  }

  /**
   * Resolves an ISIN into the most appropriate market ticker symbol
   */
  async resolveTickerFromIsin(isin: string): Promise<ResolvedSymbolResult | null> {
    const quotes = await this.searchYahooSymbols(isin);
    if (!quotes || quotes.length === 0) return null;

    // Prioritize European EUR exchanges (.AS, .DE, .PA, .MI, .MC) for UCITS ETFs
    const eurExchangeMatch = quotes.find((q) => /\.(AS|DE|PA|MI|MC|F)$/i.test(q.symbol));

    // Secondary: Any ETF or mutual fund
    const etfMatch = quotes.find((q) => q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND');

    const bestMatch = eurExchangeMatch || etfMatch || quotes[0];

    return {
      symbol: bestMatch.symbol,
      name: bestMatch.longname || bestMatch.shortname,
      exchange: bestMatch.exchDisp || bestMatch.exchange,
      quotes,
    };
  }

  /**
   * Dispatches fetch depending on the configured API provider
   */
  private async fetchQuoteForAsset(asset: Asset): Promise<QuoteFetchResult> {
    const settings = this.storage.settings();
    const { provider, apiKey, corsProxyUrl, customProxyUrlTemplate } = settings.apiSettings;
    let ticker = asset.ticker.trim();

    // Auto-resolve ticker from ISIN if ticker is missing
    if (!ticker && asset.isin.trim()) {
      const resolved = await this.resolveTickerFromIsin(asset.isin.trim());
      if (resolved?.symbol) {
        ticker = resolved.symbol;
        asset.ticker = ticker;
        if (!asset.name && resolved.name) {
          asset.name = resolved.name;
        }
        this.storage.saveAsset(asset);
      }
    }

    if (!ticker) {
      return {
        isin: asset.isin,
        ticker,
        success: false,
        error: 'Ticker symbol is required for automated quotes',
      };
    }

    try {
      switch (provider) {
        case 'yahoo_cors':
          return await this.fetchYahooCorsQuote(ticker, asset.isin, corsProxyUrl);

        case 'fmp':
          return await this.fetchFmpQuote(ticker, asset.isin, apiKey);

        case 'alphavantage':
          return await this.fetchAlphaVantageQuote(ticker, asset.isin, apiKey);

        case 'custom_proxy':
          return await this.fetchCustomProxyQuote(ticker, asset.isin, customProxyUrlTemplate);

        default:
          return await this.fetchYahooCorsQuote(ticker, asset.isin, corsProxyUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Market request failed';
      return {
        isin: asset.isin,
        ticker,
        success: false,
        error: msg,
      };
    }
  }

  private async fetchYahooCorsQuote(
    ticker: string,
    isin: string,
    corsProxyUrl: string,
  ): Promise<QuoteFetchResult> {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
    const proxyBase = corsProxyUrl || 'https://api.allorigins.win/raw?url=';
    const requestUrl = `${proxyBase}${encodeURIComponent(targetUrl)}`;

    const response = await firstValueFrom(
      this.http.get<YahooChartResponse>(requestUrl).pipe(timeout(10000)),
    );

    const result = response.chart?.result?.[0];
    if (!result) {
      return {
        isin,
        ticker,
        success: false,
        error: 'Symbol not found on Yahoo Finance',
      };
    }

    const price = result.meta.regularMarketPrice;
    let high = result.meta.fiftyTwoWeekHigh ?? price;

    // Check indicator highs if fiftyTwoWeekHigh is not directly present
    const highs = result.indicators?.quote?.[0]?.high;
    if (highs && highs.length > 0) {
      const validHighs = highs.filter((h): h is number => typeof h === 'number' && !isNaN(h));
      if (validHighs.length > 0) {
        high = Math.max(high, ...validHighs);
      }
    }

    return {
      isin,
      ticker,
      price: Math.round(price * 100) / 100,
      ath: Math.round(high * 100) / 100,
      name: result.meta.shortName || result.meta.longName,
      currency: result.meta.currency,
      success: true,
    };
  }

  private async fetchFmpQuote(
    ticker: string,
    isin: string,
    apiKey: string,
  ): Promise<QuoteFetchResult> {
    if (!apiKey) {
      return {
        isin,
        ticker,
        success: false,
        error: 'FinancialModelingPrep API key missing in Settings',
      };
    }

    interface FmpItem {
      price: number;
      yearHigh?: number;
      name?: string;
    }

    const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(ticker)}?apikey=${apiKey}`;
    const data = await firstValueFrom(this.http.get<FmpItem[]>(url).pipe(timeout(10000)));

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      return {
        isin,
        ticker,
        price: item.price,
        ath: item.yearHigh ?? item.price,
        name: item.name,
        success: true,
      };
    }

    return {
      isin,
      ticker,
      success: false,
      error: 'No quote returned from FMP',
    };
  }

  private async fetchAlphaVantageQuote(
    ticker: string,
    isin: string,
    apiKey: string,
  ): Promise<QuoteFetchResult> {
    if (!apiKey) {
      return {
        isin,
        ticker,
        success: false,
        error: 'Alpha Vantage API key missing in Settings',
      };
    }

    interface AvResponse {
      'Global Quote'?: {
        '05. price'?: string;
        '03. high'?: string;
      };
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    const data = await firstValueFrom(this.http.get<AvResponse>(url).pipe(timeout(10000)));

    const quote = data['Global Quote'];
    if (quote && quote['05. price']) {
      const price = parseFloat(quote['05. price']);
      const high = quote['03. high'] ? parseFloat(quote['03. high']) : price;
      return {
        isin,
        ticker,
        price,
        ath: high,
        success: true,
      };
    }

    return {
      isin,
      ticker,
      success: false,
      error: 'No quote returned from Alpha Vantage',
    };
  }

  private async fetchCustomProxyQuote(
    ticker: string,
    isin: string,
    urlTemplate: string,
  ): Promise<QuoteFetchResult> {
    if (!urlTemplate) {
      return {
        isin,
        ticker,
        success: false,
        error: 'Custom Proxy URL template missing in Settings',
      };
    }

    const finalUrl = urlTemplate
      .replace('{ticker}', encodeURIComponent(ticker))
      .replace('{isin}', encodeURIComponent(isin));

    interface GenericQuote {
      price?: number;
      ath?: number;
      name?: string;
    }

    const data = await firstValueFrom(this.http.get<GenericQuote>(finalUrl).pipe(timeout(10000)));

    if (data && typeof data.price === 'number') {
      return {
        isin,
        ticker,
        price: data.price,
        ath: data.ath ?? data.price,
        name: data.name,
        success: true,
      };
    }

    return {
      isin,
      ticker,
      success: false,
      error: 'Invalid JSON response from custom proxy',
    };
  }
}
