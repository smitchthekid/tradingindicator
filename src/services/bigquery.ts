import { OHLCVData } from '../types';

export interface ApiResponse {
  data: OHLCVData[];
  error?: string;
  fromCache?: boolean;
}

/**
 * Fetch data from Google BigQuery
 * 
 * IMPORTANT LIMITATION: BigQuery public datasets don't have direct stock/crypto OHLCV price data.
 * Available public datasets include:
 * - Blockchain transaction data (not prices)
 * - Economic indicators (GDP, etc.)
 * - Census and demographic data
 * 
 * For actual price data, you would need to:
 * 1. Use a paid BigQuery dataset (Google Cloud Marketplace has financial data)
 * 2. Import your own data into BigQuery
 * 3. Use a different free provider (Yahoo Finance, etc.)
 * 
 * This service is included for future use if you set up your own BigQuery dataset.
 */
export async function fetchBigQueryData(
  symbol: string,
  apiKey: string, // Google Cloud service account JSON key (base64 encoded) or project ID
  useProxy: boolean = true
): Promise<ApiResponse> {
  try {
    const isCryptoSymbol = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'SHIB', 'MATIC', 'LTC', 'UNI', 'LINK', 'ATOM', 'ETC', 'XLM', 'BCH', 'ALGO', 'VET', 'ICP', 'FIL', 'TRX', 'EOS', 'AAVE', 'THETA', 'XMR', 'MKR', 'DASH', 'ZEC'].includes(symbol.toUpperCase());
    
    // BigQuery SQL query for crypto (Bitcoin example)
    // Note: This is a simplified example - actual implementation needs proper SQL
    let query = '';
    let dataset = '';
    
    if (isCryptoSymbol && symbol.toUpperCase() === 'BTC') {
      // Bitcoin blockchain data from public dataset
      dataset = 'bigquery-public-data.crypto_bitcoin';
      query = `
        SELECT 
          DATE(timestamp) as date,
          AVG(output_value) as close,
          MIN(output_value) as low,
          MAX(output_value) as high,
          COUNT(*) as volume
        FROM \`bigquery-public-data.crypto_bitcoin.transactions\`
        WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 YEAR)
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 730
      `;
    } else {
      // For other symbols, you'd need to find appropriate public datasets
      // or use a paid dataset like GCP's financial data
      return {
        data: [],
        error: `BigQuery public datasets don't have direct stock/crypto price data for ${symbol}. Consider using Yahoo Finance or other providers.`
      };
    }
    
    // BigQuery requires backend proxy due to authentication and CORS
    const isDev = import.meta.env.DEV;
    let url: string;
    
    if (isDev || useProxy) {
      // Use backend proxy endpoint
      url = `/api/bigquery`;
    } else {
      return {
        data: [],
        error: 'BigQuery requires a backend proxy for authentication. Set up a proxy server or use useProxy=true.'
      };
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        projectId: apiKey, // Or use service account credentials
        dataset,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: [],
        error: `BigQuery request failed: ${response.status}. ${errorText}`
      };
    }
    
    const json = await response.json();
    
    if (json.error) {
      return {
        data: [],
        error: `BigQuery error: ${json.error.message || JSON.stringify(json.error)}`
      };
    }
    
    // Parse BigQuery results
    const rows = json.rows || [];
    if (rows.length === 0) {
      return {
        data: [],
        error: `No data returned from BigQuery for symbol "${symbol}"`
      };
    }
    
    // Convert BigQuery format to OHLCVData
    const data: OHLCVData[] = rows
      .map((row: any) => {
        const date = row.f[0]?.v; // BigQuery returns fields as f[0], f[1], etc.
        const close = parseFloat(row.f[1]?.v || '0');
        const low = parseFloat(row.f[2]?.v || '0');
        const high = parseFloat(row.f[3]?.v || '0');
        const volume = parseInt(row.f[4]?.v || '0');
        
        if (!date || isNaN(close) || close <= 0) {
          return null;
        }
        
        // Format date as YYYY-MM-DD
        const dateStr = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0];
        
        return {
          date: dateStr,
          open: close, // Approximate if not available
          high: high || close,
          low: low || close,
          close,
          volume: volume || 0,
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
    
    console.log(`BigQuery: Fetched ${data.length} data points from ${data[0].date} to ${data[data.length - 1].date}`);
    
    return { data };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error
        ? `BigQuery error: ${error.message}. Note: BigQuery requires Google Cloud authentication and a backend proxy.`
        : 'Unknown error occurred',
    };
  }
}

