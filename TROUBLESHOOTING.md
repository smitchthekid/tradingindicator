# Troubleshooting Guide

## If "All Broken" - Quick Fixes

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab for errors.

### 2. Common Issues Fixed

#### Volume Bar Issue
- **Fixed**: Changed from `shape` prop to `Cell` components for conditional coloring
- Volume bars now properly show green (up days) and red (down days)

#### TypeScript Errors
- **Fixed**: Removed unused imports and variables
- **Fixed**: Added missing dependency to useMemo hook

### 3. Restart Servers

**Stop all servers:**
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Start Development Server:**
```powershell
cd "C:\Users\juxwa\Desktop\apps.pleasecart.net\TradingIndicator"
npm run dev
```
- URL: http://localhost:3001

**Start Production Server:**
```powershell
cd "C:\Users\juxwa\Desktop\apps.pleasecart.net\TradingIndicator"
npm run start
```
- URL: http://localhost:3000

### 4. Clear Browser Cache
- Press `Ctrl+Shift+Delete` in browser
- Clear cached images and files
- Hard refresh: `Ctrl+F5`

### 5. Check for Runtime Errors

**Common Runtime Issues:**

1. **Volume Bar Error**: Fixed - now uses Cell components
2. **ATR Line Error**: Check if ATR is enabled in config
3. **Missing Data**: Ensure symbol is entered and data is loaded

### 6. Verify Build
```powershell
cd "C:\Users\juxwa\Desktop\apps.pleasecart.net\TradingIndicator"
npm run build
```

Should complete without errors.

### 7. Check Network Tab
- Open DevTools → Network tab
- Look for failed requests (red entries)
- Check if API calls are working

### 8. Reinstall Dependencies (if needed)
```powershell
cd "C:\Users\juxwa\Desktop\apps.pleasecart.net\TradingIndicator"
Remove-Item -Recurse -Force node_modules
npm install
```

## Recent Changes Made

1. ✅ Added ATR visualization with secondary Y-axis
2. ✅ Added volume bars with conditional coloring
3. ✅ Enhanced tooltips with ATR and volume
4. ✅ Added ATR background shading for high volatility
5. ✅ Added ATR-based stop loss visualization
6. ✅ Fixed TypeScript compilation errors
7. ✅ Fixed volume bar implementation (Cell components)

## If Still Broken

1. Check browser console for specific error messages
2. Verify Node.js version: `node --version` (should be 16+)
3. Check if ports 3000 and 3001 are available
4. Try a different browser
5. Check firewall/antivirus settings

