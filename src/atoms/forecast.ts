import { atom } from 'jotai';
import { ForecastResult } from '../types/forecast';
import { OHLCVData } from '../types';

/**
 * Bounded cache for forecast models
 * Keeps only the most recent 4 models to limit memory usage
 */
interface ForecastCacheEntry {
  model: 'simple' | 'arima' | 'prophet' | 'lstm';
  data: OHLCVData[];
  forecastPeriod: number;
  confidenceLevel: number;
  result: ForecastResult;
  timestamp: number;
}

class ForecastCache {
  private cache: Map<string, ForecastCacheEntry> = new Map();
  private readonly maxSize = 4;
  private readonly maxAge = 5 * 60 * 1000; // 5 minutes

  private generateKey(
    model: string,
    symbol: string,
    forecastPeriod: number,
    confidenceLevel: number,
    dataHash: string
  ): string {
    return `${model}:${symbol}:${forecastPeriod}:${confidenceLevel}:${dataHash}`;
  }

  private hashData(data: OHLCVData[]): string {
    // Simple hash based on data length and last few prices
    if (data.length === 0) return 'empty';
    const lastPrices = data.slice(-5).map(d => d.close.toFixed(2)).join(',');
    return `${data.length}:${lastPrices}`;
  }

  get(
    model: string,
    symbol: string,
    data: OHLCVData[],
    forecastPeriod: number,
    confidenceLevel: number
  ): ForecastResult | null {
    const dataHash = this.hashData(data);
    const key = this.generateKey(model, symbol, forecastPeriod, confidenceLevel, dataHash);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if cache entry is stale
    const age = Date.now() - entry.timestamp;
    if (age > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  set(
    model: 'simple' | 'arima' | 'prophet' | 'lstm',
    symbol: string,
    data: OHLCVData[],
    forecastPeriod: number,
    confidenceLevel: number,
    result: ForecastResult
  ): void {
    const dataHash = this.hashData(data);
    const key = this.generateKey(model, symbol, forecastPeriod, confidenceLevel, dataHash);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      this.cache.delete(entries[0][0]);
    }

    this.cache.set(key, {
      model,
      data,
      forecastPeriod,
      confidenceLevel,
      result,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Remove entries for a specific symbol when data changes
  evictSymbol(symbol: string): void {
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(`:${symbol}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const forecastCache = new ForecastCache();

// Expose cache clearing to window for debugging
if (typeof window !== 'undefined') {
  (window as any).forecastCache = forecastCache;
  (window as any).clearForecastCache = () => {
    forecastCache.clear();
    console.log('Forecast cache cleared');
  };
}

// Base atoms for forecast state
export const forecastModelAtom = atom<'simple' | 'arima' | 'prophet' | 'lstm'>('simple');
export const forecastEnabledAtom = atom<boolean>(true);
export const forecastPeriodAtom = atom<number>(90);
export const forecastConfidenceAtom = atom<number>(0.95);

// Derived atom for current forecast config
export const forecastConfigAtom = atom(
  (get) => ({
    enabled: get(forecastEnabledAtom),
    model: get(forecastModelAtom),
    forecastPeriod: get(forecastPeriodAtom),
    confidenceLevel: get(forecastConfidenceAtom),
  })
);

// Individual model forecast atoms (computed on demand)
export const simpleForecastAtom = atom<ForecastResult | null>(null);
export const arimaForecastAtom = atom<ForecastResult | null>(null);
export const prophetForecastAtom = atom<ForecastResult | null>(null);
export const lstmForecastAtom = atom<ForecastResult | null>(null);

// Active forecast atom - selects the current model's forecast
export const activeForecastAtom = atom(
  (get) => {
    const model = get(forecastModelAtom);
    const enabled = get(forecastEnabledAtom);
    
    if (!enabled) return null;

    switch (model) {
      case 'simple':
        return get(simpleForecastAtom);
      case 'arima':
        return get(arimaForecastAtom);
      case 'prophet':
        return get(prophetForecastAtom);
      case 'lstm':
        return get(lstmForecastAtom);
      default:
        return null;
    }
  }
);

// UI state atoms
export const forecastLoadingAtom = atom<boolean>(false);
export const forecastErrorAtom = atom<string | null>(null);

