# ChartPreview.tsx Refactoring Summary

## Files Created

### Utilities
1. **`src/utils/chartData.ts`** - Centralized data processing utilities
   - `normalizeDate()` - Date normalization
   - `sortChartDataByTimestamp()` - Data sorting
   - `filterValidHistoricalData()` - Data filtering
   - `calculateYDomain()` - Y-axis domain calculation
   - `calculateVolumeDomain()` - Volume axis domain
   - `calculateATRDomain()` - ATR axis domain
   - `calculateATRThresholds()` - ATR threshold calculation

2. **`src/utils/scheduler.ts`** - Scheduler utilities
   - `scheduleIdleCallback()` - Uses requestIdleCallback with setTimeout fallback
   - `cancelIdleCallback()` - Cancel scheduled callbacks
   - `scheduleTasks()` - Schedule multiple tasks with delays

### Hooks
3. **`src/hooks/useAlerts.ts`** - Alert management hook
   - Centralizes alert state and operations
   - Provides `dismissAlert()` and `clearAllAlerts()`

4. **`src/hooks/useForecasts.ts`** - Forecast management hook
   - Centralizes forecast state and computation
   - Uses scheduler utility instead of multiple setTimeout calls
   - Handles forecast cache eviction

5. **`src/hooks/useIndicators.ts`** - Indicators, signals, and risk metrics hook
   - Centralizes calculation logic
   - Retains last known good values on error (prevents flickering)
   - Explicit dependency array

### Styles
6. **`src/styles/chartTheme.ts`** - Centralized theme
   - All colors, styles, and styling constants
   - Reusable across chart components

## Key Refactorings Applied

### 1. Dependency Management
- ✅ Created `useIndicators` hook with explicit, minimal dependencies
- ✅ Created `useForecasts` hook to replace complex forecast useEffect
- ✅ Created `useAlerts` hook for alert management
- ⚠️ **TODO**: Refactor remaining useEffect hooks in ChartPreview.tsx to use these hooks

### 2. Performance Patterns
- ✅ Created `scheduler.ts` utility with requestIdleCallback support
- ✅ `useForecasts` hook uses scheduler instead of multiple setTimeout
- ⚠️ **TODO**: Apply scheduler to other deferred computations
- ⚠️ **TODO**: Add deep equality checks for memoization

### 3. Error Handling
- ✅ `useIndicators` hook retains last known good values
- ✅ Prevents UI flicker on calculation errors
- ⚠️ **TODO**: Apply same pattern to other error-prone calculations

### 4. Data Processing
- ✅ Created `chartData.ts` with reusable utilities
- ✅ Abstracted date normalization, sorting, filtering
- ✅ Abstracted domain calculations
- ⚠️ **TODO**: Refactor ChartPreview to use these utilities

### 5. Styling
- ✅ Created `chartTheme.ts` with all styles
- ⚠️ **TODO**: Replace inline styles in ChartPreview with theme references

## Next Steps

To complete the refactoring:

1. **Update ChartPreview.tsx imports** to use new utilities and hooks
2. **Replace useEffect hooks** with custom hooks where applicable
3. **Replace inline styles** with theme constants
4. **Use chartData utilities** for all data processing
5. **Break component into subcomponents** for chart layers

## Migration Guide

### Before:
```tsx
const [signals, setSignals] = useState<TradingSignal[]>([]);
// ... complex useEffect for indicators
```

### After:
```tsx
const { indicators, signals, supportResistance, riskMetrics } = useIndicators(marketData, config);
```

### Before:
```tsx
setTimeout(() => {
  // forecast computation
}, 0);
```

### After:
```tsx
scheduleIdleCallback(() => {
  // forecast computation
}, { timeout: 100 });
```

### Before:
```tsx
const yDomain = calculateYDomain(); // inline function
```

### After:
```tsx
import { calculateYDomain } from '../utils/chartData';
const yDomain = useMemo(() => calculateYDomain(allPrices), [allPrices]);
```

