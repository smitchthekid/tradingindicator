import { OHLCVData } from '../types';
import { getCachedData, setCachedData } from '../utils/cache';

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';
const EODHD_BASE = 'https://eodhistoricaldata.com/api/eod';

export interface ApiResponse {
  data: OHLCVData[];
  error?: string;
  fromCache?: boolean;
}

/**
 * Check if symbol is a cryptocurrency
 */
function isCrypto(symbol: string): boolean {
  const cryptoList = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'SHIB', 'MATIC', 'LTC', 'UNI', 'LINK', 'ATOM', 'ETC', 'XLM', 'BCH', 'ALGO', 'VET', 'ICP', 'FIL', 'TRX', 'EOS', 'AAVE', 'THETA', 'XMR', 'MKR', 'DASH', 'ZEC'];
  return cryptoList.includes(symbol.toUpperCase());
}

/**
 * Fetch data from Alpha Vantage API
 */
export async function fetchAlphaVantageData(
  symbol: string,
  apiKey: string
): Promise<ApiResponse> {
  try {
    const isCryptoSymbol = isCrypto(symbol);
    let url: string;
    
    if (isCryptoSymbol) {
      // Use digital currency endpoint for crypto
      // Note: Alpha Vantage crypto endpoint may have limited historical data
      // For better historical data, consider using EODHD or another provider
      url = `${ALPHA_VANTAGE_BASE}?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${apiKey}&datatype=json`;
    } else {
      // Use regular stock endpoint - use 'full' to get maximum historical data (up to 20 years)
      url = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full&datatype=json`;
    }
    
    const response = await fetch(url);
    const json = await response.json();
    
    if (json['Error Message']) {
      return { data: [], error: json['Error Message'] };
    }
    
    if (json['Note']) {
      return { data: [], error: 'API call frequency limit reached. Please try again later.' };
    }
    
    let timeSeries: any;
    if (isCryptoSymbol) {
      timeSeries = json['Time Series (Digital Currency Daily)'];
    } else {
      timeSeries = json['Time Series (Daily)'];
    }
    
    if (!timeSeries) {
      return { data: [], error: 'Invalid response from Alpha Vantage API. Make sure the symbol is correct.' };
    }
    
    // Parse dates and validate they are real calendar dates
    const data: OHLCVData[] = Object.entries(timeSeries)
      .map(([dateStr, values]: [string, any]) => {
        // Validate date format (should be YYYY-MM-DD)
        const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!dateMatch) {
          console.warn(`Invalid date format from API: ${dateStr}`);
          return null;
        }
        
        // Validate it's a real date
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) {
          console.warn(`Invalid date value: ${dateStr}`);
          return null;
        }
        
        // Ensure date is not in the future (with 1 day tolerance for timezone issues)
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        if (dateObj > today) {
          console.warn(`Future date detected and skipped: ${dateStr}`);
          return null;
        }
        
        if (isCryptoSymbol) {
          // Crypto format: '1a. open (USD)', '2a. high (USD)', etc.
          return {
            date: dateStr, // Keep as YYYY-MM-DD string for consistency
            open: parseFloat(values['1a. open (USD)'] || values['1. open'] || '0'),
            high: parseFloat(values['2a. high (USD)'] || values['2. high'] || '0'),
            low: parseFloat(values['3a. low (USD)'] || values['3. low'] || '0'),
            close: parseFloat(values['4a. close (USD)'] || values['4. close'] || '0'),
            volume: parseInt(values['5. volume'] || values['5a. volume'] || '0'),
          };
        } else {
          // Stock format
          return {
            date: dateStr, // Keep as YYYY-MM-DD string for consistency
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume']),
          };
        }
      })
      .filter((d): d is OHLCVData => d !== null && !isNaN(d.close) && d.close > 0)
      .sort((a, b) => {
        // Sort chronologically by date string (YYYY-MM-DD format sorts correctly)
        return a.date.localeCompare(b.date);
      });
    
    if (data.length === 0) {
      return { data: [], error: 'No valid data returned. Check if the symbol format is correct.' };
    }
    
    // Log data range for debugging
    if (data.length > 0) {
      const firstDate = new Date(data[0].date);
      const lastDate = new Date(data[data.length - 1].date);
      const daysDiff = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthsDiff = daysDiff / 30;
      
      console.log(`Alpha Vantage: Fetched ${data.length} data points from ${data[0].date} to ${data[data.length - 1].date} (${daysDiff} days, ~${monthsDiff.toFixed(1)} months)`);
      
      // Warn if insufficient historical data
      if (daysDiff < 90) {
        console.warn(`Warning: Only ${daysDiff} days of historical data. For best results, aim for 6-12 months (180-365 days).`);
      }
    }
    
    return { data };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Fetch data from EODHD API
 */
export async function fetchEODHDData(
  symbol: string,
  apiKey: string
): Promise<ApiResponse> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const fromDate = oneYearAgo.toISOString().split('T')[0];
    
    const isCryptoSymbol = isCrypto(symbol);
    let url: string;
    
    if (isCryptoSymbol) {
      // Crypto format: BTC-USD.CC for EODHD
      url = `${EODHD_BASE}/${symbol}-USD.CC?from=${fromDate}&to=${today}&api_token=${apiKey}&period=d&fmt=json`;
    } else {
      // Stock format: SYMBOL.US
      url = `${EODHD_BASE}/${symbol}.US?from=${fromDate}&to=${today}&api_token=${apiKey}&period=d&fmt=json`;
    }
    
    let response: Response;
    let json: any;
    
    try {
      response = await fetch(url);
      
      if (!response.ok) {
        // Try alternative crypto formats if first attempt fails
        if (isCryptoSymbol) {
          const altFormats = [
            `${symbol}.CC`,  // BTC.CC
            `${symbol}-USD.CC`,  // BTC-USD.CC (already tried, but keep for clarity)
            `CRYPTO.${symbol}.USD`,  // CRYPTO.BTC.USD
          ];
          
          for (const format of altFormats) {
            if (format === `${symbol}-USD.CC`) continue; // Already tried
            try {
              const altUrl = `${EODHD_BASE}/${format}?from=${fromDate}&to=${today}&api_token=${apiKey}&period=d&fmt=json`;
              const altResponse = await fetch(altUrl);
              if (altResponse.ok) {
                const altJson = await altResponse.json();
                if (Array.isArray(altJson) && altJson.length > 0) {
                  const data: OHLCVData[] = altJson.map((item: any) => ({
                    date: item.date,
                    open: parseFloat(item.open),
                    high: parseFloat(item.high),
                    low: parseFloat(item.low),
                    close: parseFloat(item.close),
                    volume: parseInt(item.volume || '0'),
                  })).filter(d => !isNaN(d.close) && d.close > 0);
                  
                  if (data.length > 0) return { data };
                }
              }
            } catch (e) {
              // Continue to next format
              continue;
            }
          }
        }
        
        // Try to get error message from response
        try {
          const errorJson = await response.json();
          const errorMsg = errorJson.error || errorJson.message || `HTTP ${response.status}`;
          return { data: [], error: errorMsg };
        } catch {
          return { data: [], error: `HTTP error: ${response.status}. ${isCryptoSymbol ? 'Crypto may not be supported by EODHD free tier. Try Alpha Vantage instead.' : 'Check if symbol is correct.'}` };
        }
      }
      
      json = await response.json();
    } catch (fetchError) {
      return {
        data: [],
        error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to fetch data'}. Check your internet connection and API key.`,
      };
    }
    
    if (Array.isArray(json) && json.length > 0) {
      const data: OHLCVData[] = json
        .map((item: any) => {
          // Validate date format
          const dateStr = item.date;
          if (!dateStr || typeof dateStr !== 'string') {
            return null;
          }
          
          // Validate it's a real date
          const dateObj = new Date(dateStr);
          if (isNaN(dateObj.getTime())) {
            console.warn(`Invalid date value from EODHD: ${dateStr}`);
            return null;
          }
          
          // Ensure date is not in the future
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (dateObj > today) {
            console.warn(`Future date detected and skipped: ${dateStr}`);
            return null;
          }
          
          return {
            date: dateStr, // Keep as string (should be YYYY-MM-DD)
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || '0'),
          };
        })
        .filter((d): d is OHLCVData => d !== null && !isNaN(d.close) && d.close > 0)
        .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically
      
      if (data.length === 0) {
        return { data: [], error: 'No valid price data returned' };
      }
      
      // Log data range for debugging
      if (data.length > 0) {
        const firstDate = new Date(data[0].date);
        const lastDate = new Date(data[data.length - 1].date);
        const daysDiff = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
        const monthsDiff = daysDiff / 30;
        
        console.log(`EODHD: Fetched ${data.length} data points from ${data[0].date} to ${data[data.length - 1].date} (${daysDiff} days, ~${monthsDiff.toFixed(1)} months)`);
        
        // Warn if insufficient historical data
        if (daysDiff < 90) {
          console.warn(`Warning: Only ${daysDiff} days of historical data. For best results, aim for 6-12 months (180-365 days).`);
        }
      }
      
      return { data };
    }
    
    if (json.error) {
      return { data: [], error: json.error };
    }
    
    return { data: [], error: 'No data returned from EODHD API' };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Fetch market data based on provider with caching
 */
export async function fetchMarketData(
  symbol: string,
  apiKey: string,
  provider: 'alphavantage' | 'eodhd',
  forceRefresh: boolean = false
): Promise<ApiResponse> {
  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cached = getCachedData(symbol, provider);
    if (cached && cached.length > 0) {
      // Only use cache if it has substantial data (more than 1 day)
      if (cached.length > 1) {
        console.log(`Using cached data: ${cached.length} points from ${cached[0].date} to ${cached[cached.length - 1].date}`);
        return { data: cached, fromCache: true };
      } else {
        console.log(`Cache has insufficient data (${cached.length} points), fetching fresh data`);
      }
    }
  }

  // Fetch from API
  let response: ApiResponse;
  if (provider === 'alphavantage') {
    response = await fetchAlphaVantageData(symbol, apiKey);
  } else {
    response = await fetchEODHDData(symbol, apiKey);
  }

  // Cache successful responses
  if (!response.error && response.data.length > 0) {
    setCachedData(symbol, provider, response.data);
    return { ...response, fromCache: false };
  }

  return { ...response, fromCache: false };
}

