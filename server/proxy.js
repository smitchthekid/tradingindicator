/**
 * Yahoo Finance Proxy Server - Version 1
 * 
 * Status: WORKING ✅
 * Date: 2024
 * 
 * This server acts as a proxy to fetch Yahoo Finance data and avoid CORS issues.
 * 
 * Setup:
 * 1. Install dependencies: npm install express cors node-fetch
 * 2. Run: npm run proxy
 * 3. Server runs on http://localhost:3002
 * 
 * For production deployment:
 * - Deploy this server to a Node.js hosting service
 * - Set VITE_PROXY_URL environment variable in your frontend build
 * - Or deploy as serverless function (Vercel, Netlify, etc.)
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PROXY_PORT || 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'yahoo-finance-proxy' });
});

/**
 * Normalize symbol for Yahoo Finance API
 * Yahoo Finance requires crypto symbols in format "BTC-USD", not just "BTC"
 */
function normalizeSymbolForYahoo(symbol) {
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

// Yahoo Finance proxy endpoint
app.get('/api/yahoo', async (req, res) => {
  try {
    const symbol = req.query.symbol?.toUpperCase();
    
    if (!symbol) {
      return res.status(400).json({ 
        error: 'Symbol parameter is required. Usage: /api/yahoo?symbol=BTC' 
      });
    }
    
    // Normalize symbol for Yahoo Finance (e.g., BTC -> BTC-USD)
    const normalizedSymbol = normalizeSymbolForYahoo(symbol);
    
    // Yahoo Finance API endpoint
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?interval=1d&range=2y&includePrePost=false`;
    
    console.log(`[Proxy] Fetching data for ${symbol} (normalized to ${normalizedSymbol}) from Yahoo Finance...`);
    
    const response = await fetch(yahooUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error(`[Proxy] Yahoo Finance error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `Yahoo Finance request failed: ${response.status} ${response.statusText}`,
      });
    }
    
    const data = await response.json();
    
    // Validate response
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      return res.status(404).json({
        error: `No data found for symbol "${symbol}" (tried "${normalizedSymbol}"). Check if symbol is correct.`,
      });
    }
    
    console.log(`[Proxy] Successfully fetched data for ${symbol} (${normalizedSymbol})`);
    res.json(data);
    
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Yahoo Finance Proxy Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Example: http://localhost:${PORT}/api/yahoo?symbol=BTC`);
});

