# Yahoo Finance CORS Fix

## Issue
- **Error**: `Yahoo Finance request failed: 404. CORS error - requires backend proxy.`
- **Cause**: The code was trying to use Vite's proxy in development mode, but it wasn't working correctly

## Solution
Updated `src/services/yahooFinance.ts` to **always use the proxy server directly** instead of relying on Vite's proxy configuration.

### Changes
**Before:**
```typescript
if (isDev) {
  // Use Vite proxy in development (configured in vite.config.ts)
  url = `/api/yahoo?symbol=${normalizedSymbol}`;
} else {
  // Production: use backend proxy server
  url = `${proxyUrl}/api/yahoo?symbol=${normalizedSymbol}`;
}
```

**After:**
```typescript
// Always use the proxy server to avoid CORS issues
// In development, use localhost:3002
// In production, use VITE_PROXY_URL or default to localhost:3002
const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3002';

// Use proxy server directly (not Vite proxy) to ensure it works in both dev and production
const url = `${proxyUrl}/api/yahoo?symbol=${normalizedSymbol}`;
```

## How It Works

1. **Development Mode**: Uses `http://localhost:3002/api/yahoo` (proxy server)
2. **Production Mode**: Uses `VITE_PROXY_URL` environment variable or defaults to `http://localhost:3002`

## Proxy Server

The proxy server is located at `server/proxy.js` and runs on port 3002.

### To Start Proxy Server:
```bash
npm run proxy
```

### To Verify Proxy Server is Running:
```bash
# Health check
curl http://localhost:3002/health

# Test API endpoint
curl "http://localhost:3002/api/yahoo?symbol=BTC"
```

## Status
✅ **Fixed** - The code now always uses the proxy server, avoiding CORS issues in both development and production.

## Next Steps
1. **Refresh your browser** to load the updated code
2. **Ensure proxy server is running**: `npm run proxy` (if not already running)
3. **Try fetching data again** - it should now work without CORS errors

## Notes
- The proxy server must be running for the app to work
- In production, set `VITE_PROXY_URL` environment variable to your deployed proxy server URL
- The proxy server handles CORS and forwards requests to Yahoo Finance API

