# Cache Clearing and Error Debugging Guide

## How to Check for YOUR App's Errors

1. **Open your TradingIndicator app** in a separate browser tab/window
   - Usually at `http://localhost:5173` (Vite dev server)
   - Or your deployed URL

2. **Open Browser DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Or `Cmd+Option+I` (Mac)
   - Or right-click → "Inspect"

3. **Filter Console to Your App**
   - In the Console tab, look for a filter icon
   - Filter by your app's URL (e.g., `localhost:5173`)
   - Or look for errors with file paths containing `src/` or `TradingIndicator`

4. **Check for Actual Errors**
   - Red errors with stack traces
   - Errors mentioning your app's files (e.g., `ChartPreview.tsx`, `forecasting.ts`)
   - Network errors when fetching data

## Clear Cache in Your App

### Method 1: Browser Console (Recommended)
1. Open DevTools (F12)
2. Go to Console tab
3. Run: `clearAllCache()`
4. Refresh page (Ctrl+R or F5)

### Method 2: Hard Refresh
- Press `Ctrl+Shift+R` (Windows/Linux)
- Or `Cmd+Shift+R` (Mac)

### Method 3: Clear Browser Cache
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page

## Common Issues and Solutions

### Interface Not Loading
1. Clear cache: `clearAllCache()` in console
2. Hard refresh: `Ctrl+Shift+R`
3. Restart dev server: Stop and run `npm run dev` again

### Forecast Not Showing
1. Check console for errors
2. Run `clearForecastCache()` in console
3. Verify data is loaded (check if chart shows historical data)
4. Check forecast settings are enabled

### Data Not Loading
1. Check API key is valid
2. Check symbol format (e.g., "AAPL" not "AAPL Stock")
3. Try switching API providers
4. Check network tab for failed requests

## Available Cache Functions

When your app loads, these functions are available in the browser console:

- `clearCache()` - Clears market data cache
- `clearForecastCache()` - Clears forecast model cache  
- `clearAllCache()` - Clears all caches (recommended)

## Note About ChatGPT Errors

Errors from `chatgpt.com` are NOT from your app. These are:
- Third-party service errors (Intercom, etc.)
- External website favicon loads
- ChatGPT's own interface issues

Ignore these and focus on errors from your app's domain.

