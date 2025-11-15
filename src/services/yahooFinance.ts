import { OHLCVData } from '../types';

export interface ApiResponse {
  data: OHLCVData[];
  error?: string;
  fromCache?: boolean;
}

/**
 * Normalize symbol for Yahoo Finance API
 * Yahoo Finance requires crypto symbols in format "BTC-USD", not just "BTC"
 */
function normalizeSymbolForYahoo(symbol: string): string {
  const upperSymbol = symbol.toUpperCase().trim();
  
  // List of common crypto symbols that need "-USD" suffix
  const cryptoSymbols = [
    'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'SHIB',
    'MATIC', 'LTC', 'UNI', 'LINK', 'ATOM', 'ETC', 'XLM', 'BCH', 'ALGO', 'VET',
    'ICP', 'FIL', 'TRX', 'EOS', 'AAVE', 'THETA', 'XMR', 'MKR', 'DASH', 'ZEC'
  ];
  
  // If symbol is already in format "XXX-USD" or "XXX-EUR", return as is
  if (upperSymbol.includes('-')) {
    return upperSymbol;
  }
  
  // If it's a known crypto symbol, add "-USD" suffix
  if (cryptoSymbols.includes(upperSymbol)) {
    return `${upperSymbol}-USD`;
  }
  
  // For stocks and other symbols, return as is
  return upperSymbol;
}

/**
 * Yahoo Finance Service - Version 1 (Current Working Version)
 * 
 * Status: WORKING ✅
 * Date: 2024
 * 
 * Features:
 * - No API key required
 * - No rate limits
 * - Uses Vite proxy in development
 * - Uses backend proxy server in production
 * 
 * Backup: See yahooFinance.v1.ts
 */
export async function fetchYahooFinanceData(
  symbol: string,
  useProxy: boolean = false
): Promise<ApiResponse> {
  try {
    // Normalize symbol for Yahoo Finance (e.g., BTC -> BTC-USD)
    const normalizedSymbol = normalizeSymbolForYahoo(symbol);
    
    // Use Vite proxy in development, backend proxy server in production
    // In development, Vite proxy handles CORS automatically
    // In production, use VITE_PROXY_URL or default to localhost:3002
    const isDev = import.meta.env.DEV;
    const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3002';
    
    // In development, use Vite proxy (relative URL)
    // In production, use backend proxy server (absolute URL)
    const url = isDev 
      ? `/api/yahoo?symbol=${normalizedSymbol}` 
      : `${proxyUrl}/api/yahoo?symbol=${normalizedSymbol}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { 
        data: [], 
        error: `Yahoo Finance request failed: ${response.status}. ${useProxy ? 'Proxy may be down.' : 'CORS error - requires backend proxy.'}` 
      };
    }
    
    const json = await response.json();
    
    if (!json.chart || !json.chart.result || json.chart.result.length === 0) {
      return { 
        data: [], 
        error: `No data found for symbol "${symbol}". Check if symbol is correct.` 
      };
    }
    
    const result = json.chart.result[0];
    
    // Validate that we got data for the correct symbol
    const returnedSymbol = result.meta?.symbol || result.meta?.exchangeName || 'unknown';
    const currency = result.meta?.currency || 'unknown';
    const regularMarketPrice = result.meta?.regularMarketPrice;
    
    console.log(`[Yahoo Finance] Requested: ${symbol}, Normalized: ${normalizedSymbol}, Returned: ${returnedSymbol}, Currency: ${currency}, Current Price: ${regularMarketPrice}`);
    
    // Warn if the returned symbol doesn't match what we requested (for crypto)
    if (normalizedSymbol.includes('-USD') && !returnedSymbol.includes(normalizedSymbol.split('-')[0])) {
      console.warn(`[Yahoo Finance] Symbol mismatch! Requested ${normalizedSymbol} but got ${returnedSymbol}. Prices may be incorrect.`);
    }
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    if (!quotes.open || quotes.open.length === 0) {
      return { 
        data: [], 
        error: `No price data available for symbol "${symbol}"` 
      };
    }
    
    // Log sample price data for debugging
    if (quotes.close && quotes.close.length > 0) {
      const sampleClose = quotes.close[quotes.close.length - 1];
      console.log(`[Yahoo Finance] Sample close price: $${sampleClose} (latest data point)`);
      
      // Warn if Bitcoin price seems incorrect (should be > $1000)
      if (normalizedSymbol.includes('BTC') && sampleClose < 1000) {
        console.error(`[Yahoo Finance] WARNING: Bitcoin price ($${sampleClose}) seems incorrect! Expected > $10,000. Check if correct symbol is being used.`);
      }
    }
    
    // Convert Yahoo Finance format to OHLCVData
    const data: OHLCVData[] = timestamps
      .map((timestamp: number, index: number) => {
        const date = new Date(timestamp * 1000);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Validate date is not in the future
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (date > today) {
          return null;
        }
        
        const open = quotes.open[index];
        const high = quotes.high[index];
        const low = quotes.low[index];
        const close = quotes.close[index];
        const volume = quotes.volume[index] || 0;
        
        if (!open || !high || !low || !close || isNaN(close) || close <= 0) {
          return null;
        }
        
        return {
          date: dateStr,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: parseInt(volume.toString()) || 0,
        };
      })
      .filter((d: OHLCVData | null): d is OHLCVData => d !== null)
      .sort((a: OHLCVData, b: OHLCVData) => a.date.localeCompare(b.date));
    
    if (data.length === 0) {
      return { 
        data: [], 
        error: `No valid data returned for symbol "${symbol}"` 
      };
    }
    
    console.log(`Yahoo Finance: Fetched ${data.length} data points from ${data[0].date} to ${data[data.length - 1].date}`);
    
    return { data };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error 
        ? `Yahoo Finance error: ${error.message}. ${useProxy ? '' : 'Note: Browser CORS restrictions require a backend proxy for production use.'}`
        : 'Unknown error occurred',
    };
  }
}

