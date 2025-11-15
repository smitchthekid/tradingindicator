import { OHLCVData } from '../types';

interface CachedData {
  data: OHLCVData[];
  timestamp: number;
  symbol: string;
  provider: string;
}

// Extended cache duration to reduce API calls
// 24 hours for free API tiers, or 1 hour for premium
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (was 5 minutes)
const CACHE_KEY_PREFIX = 'market-data-cache-';

/**
 * Generate cache key from symbol and provider
 */
function getCacheKey(symbol: string, provider: string): string {
  return `${CACHE_KEY_PREFIX}${provider}-${symbol.toUpperCase()}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cached: CachedData): boolean {
  const age = Date.now() - cached.timestamp;
  return age < CACHE_DURATION;
}

/**
 * Get cached market data if available and valid
 */
export function getCachedData(
  symbol: string,
  provider: string
): OHLCVData[] | null {
  try {
    const key = getCacheKey(symbol, provider);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const parsed: CachedData = JSON.parse(cached);
    
    // Verify it's for the same symbol/provider
    if (parsed.symbol.toUpperCase() !== symbol.toUpperCase() || parsed.provider !== provider) {
      return null;
    }
    
    // Check if cache is still valid
    if (!isCacheValid(parsed)) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.warn('Failed to read cache:', error);
    return null;
  }
}

/**
 * Cache market data
 */
export function setCachedData(
  symbol: string,
  provider: string,
  data: OHLCVData[]
): void {
  try {
    const key = getCacheKey(symbol, provider);
    const cached: CachedData = {
      data,
      timestamp: Date.now(),
      symbol: symbol.toUpperCase(),
      provider,
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

/**
 * Clear all cached market data
 */
export function clearCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Market data cache cleared');
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

/**
 * Clear all application cache (market data + forecast cache)
 * Call this when interface is broken or needs reset
 */
export function clearAllCache(): void {
  clearCache();
  // Also clear forecast cache if available
  if (typeof window !== 'undefined' && (window as any).forecastCache) {
    (window as any).forecastCache.clear();
    console.log('Forecast cache cleared');
  }
  console.log('All caches cleared');
}

/**
 * Get cache age in minutes
 */
export function getCacheAge(symbol: string, provider: string): number | null {
  try {
    const key = getCacheKey(symbol, provider);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const parsed: CachedData = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    return Math.floor(age / 60000); // Convert to minutes
  } catch {
    return null;
  }
}

