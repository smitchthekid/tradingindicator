import { OHLCVData } from '../types';
import { getCachedData, setCachedData, clearCache } from '../utils/cache';
import { fetchYahooFinanceData } from './yahooFinance';

export interface ApiResponse {
  data: OHLCVData[];
  error?: string;
  fromCache?: boolean;
}

/**
 * Fetch market data from Yahoo Finance with caching
 */
export async function fetchMarketData(
  symbol: string,
  _apiKey: string = '', // Not used for Yahoo Finance, kept for compatibility
  provider: 'yahoo' = 'yahoo',
  forceRefresh: boolean = false
): Promise<ApiResponse> {
  // Normalize symbol for cache lookup (to handle both BTC and BTC-USD)
  const normalizedSymbol = symbol.toUpperCase().trim();
  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'SHIB',
    'MATIC', 'LTC', 'UNI', 'LINK', 'ATOM', 'ETC', 'XLM', 'BCH', 'ALGO', 'VET',
    'ICP', 'FIL', 'TRX', 'EOS', 'AAVE', 'THETA', 'XMR', 'MKR', 'DASH', 'ZEC'];
  const cacheSymbol = normalizedSymbol.includes('-') ? normalizedSymbol : 
    (cryptoSymbols.includes(normalizedSymbol) ? `${normalizedSymbol}-USD` : normalizedSymbol);
  
  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cached = getCachedData(cacheSymbol, provider);
    if (cached && cached.length > 0) {
      // Validate cached data - check if Bitcoin prices seem reasonable
      if (cacheSymbol.includes('BTC') || cacheSymbol.includes('BTC-USD')) {
        const latestPrice = cached[cached.length - 1]?.close;
        if (latestPrice && latestPrice < 1000) {
          console.warn(`[Cache] Invalid cached BTC price ($${latestPrice}), clearing cache and fetching fresh data`);
          // Clear invalid cache
          clearCache();
        } else if (latestPrice) {
          console.log(`Using cached data: ${cached.length} points from ${cached[0].date} to ${cached[cached.length - 1].date}, latest price: $${latestPrice}`);
          return { data: cached, fromCache: true };
        }
      } else {
        // Only use cache if it has substantial data (more than 1 day)
        if (cached.length > 1) {
          console.log(`Using cached data: ${cached.length} points from ${cached[0].date} to ${cached[cached.length - 1].date}`);
          return { data: cached, fromCache: true };
        } else {
          console.log(`Cache has insufficient data (${cached.length} points), fetching fresh data`);
        }
      }
    }
  }

  // Fetch from Yahoo Finance
  const response = await fetchYahooFinanceData(symbol, false);

  // Cache successful responses using normalized symbol
  if (!response.error && response.data.length > 0) {
    setCachedData(cacheSymbol, provider, response.data);
    return { ...response, fromCache: false };
  }

  return { ...response, fromCache: false };
}
