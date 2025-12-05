/**
 * Yahoo Finance Service - Version 1 (Backup)
 * 
 * This is a backup of the working Yahoo Finance implementation.
 * Date: 2024
 * Status: WORKING ✅
 * 
 * Features:
 * - Uses Vite proxy in development
 * - Uses backend proxy server in production
 * - No API key required
 * - No rate limits
 */

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
 * Fetch data from Yahoo Finance (public data, no API key required)
 * Version 1 - Working implementation
 */
export async function fetchYahooFinanceData(
  symbol: string,
  _useProxy: boolean = false
): Promise<ApiResponse> {
  // Suppress unused parameter warning - kept for future proxy support
  void _useProxy;
  try {
    // Normalize symbol for Yahoo Finance (e.g., BTC -> BTC-USD)
    const normalizedSymbol = normalizeSymbolForYahoo(symbol);
    
    // Use Vite dev server proxy in development, or production proxy server
    const isDev = import.meta.env.DEV;
    const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3002';
    let url: string;
    
    if (isDev) {
      // Use Vite proxy in development (configured in vite.config.ts)
      url = `/api/yahoo?symbol=${normalizedSymbol}`;
    } else {
      // Production: use backend proxy server
      // Set VITE_PROXY_URL environment variable to your proxy server URL
      // Example: VITE_PROXY_URL=https://your-domain.com
      url = `${proxyUrl}/api/yahoo?symbol=${normalizedSymbol}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { 
        data: [], 
        error: `Yahoo Finance request failed: ${response.status}. ${isDev ? 'Make sure Vite dev server is running.' : 'Check proxy server configuration.'}` 
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
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    if (!quotes.open || quotes.open.length === 0) {
      return { 
        data: [], 
        error: `No price data available for symbol "${symbol}"` 
      };
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
        ? `Yahoo Finance error: ${error.message}. Make sure Vite dev server is running with proxy configured or check proxy server is running.`
        : 'Unknown error occurred',
    };
  }
}

