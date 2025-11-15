# Chart Rendering Diagnostics & Fixes

## Issues Identified

After comprehensive analysis, the following issues were identified that could prevent chart data from rendering:

### 1. **Y-Axis Domain Calculation Issues**
- Domain might be calculated before data is available, resulting in invalid `[0, 100]` default
- Domain validation was insufficient, allowing invalid domains to pass through
- No fallback mechanism when parent domain calculation fails

### 2. **X-Axis Configuration**
- Missing explicit `scale="linear"` for numeric timestamps
- Potential confusion between `type="number"` and time-based scaling

### 3. **Line Rendering Configuration**
- `connectNulls={false}` might skip rendering if there are any null values
- Missing explicit `strokeOpacity` could cause visibility issues

### 4. **Y-Axis Orientation**
- Missing explicit `orientation="left"` could cause positioning issues

## Fixes Applied

### 1. Enhanced Y-Axis Domain Calculation (`HistoricalChart.tsx`)
- Added robust validation for passed domain (type checking, range validation)
- Implemented fallback calculation from actual chart data
- Added comprehensive logging for debugging
- Returns `['auto', 'auto']` if all calculations fail, letting Recharts handle it

### 2. Improved Domain Validation (`ChartPreview.tsx`)
- Returns `null` instead of `[0, 100]` when no data is available
- Added validation for price ranges (min > 0, max > min, no NaN)
- Final domain validation before returning

### 3. X-Axis Configuration (`HistoricalChart.tsx`)
- Added explicit `scale="linear"` for numeric timestamp data
- Maintained `type="number"` with `domain={["dataMin", "dataMax"]}`

### 4. PriceLayer Enhancements (`PriceLayer.tsx`)
- Changed `connectNulls={false}` to `connectNulls={true}` to ensure continuous lines
- Added explicit `strokeOpacity={1}` for maximum visibility

### 5. Y-Axis Orientation (`HistoricalChart.tsx`)
- Added explicit `orientation="left"` to Y-axis

### 6. Comprehensive Diagnostic Logging
- Added logging in `HistoricalChart` to show:
  - Data structure and sample points
  - X and Y ranges
  - Domain calculations
  - Validation results

## Testing Checklist

After these fixes, verify:

1. **Console Logs** - Check browser console for:
   - `[ChartPreview] Y-axis domain calculated: [...]`
   - `[HistoricalChart] Data received: {...}`
   - `[HistoricalChart] Rendering with: {...}`
   - `[HistoricalChart] Calculated Y-domain from data: [...]` (if fallback used)

2. **Visual Verification**:
   - ✅ Price line (white/light gray) is visible
   - ✅ Volume bars are visible at bottom
   - ✅ EMA line is visible (if enabled)
   - ✅ ATR line is visible (if enabled)
   - ✅ Volatility bands are visible (if enabled)
   - ✅ Grid lines are visible
   - ✅ X-axis labels show dates
   - ✅ Y-axis labels show prices

3. **Data Validation**:
   - Check that data points have valid `dateTimestamp` (numbers)
   - Check that data points have valid `close` prices (numbers > 0)
   - Verify domain range matches price range

## Next Steps if Still Not Rendering

If chart still doesn't render after these fixes:

1. **Check Browser Console** for any Recharts errors
2. **Inspect SVG Element** in DevTools:
   - Look for `<g class="recharts-layer">` elements
   - Check for `<path>` elements with `stroke` attributes
   - Verify no CSS is hiding elements (`display: none`, `opacity: 0`)
3. **Verify Data Structure**:
   - Open console and check logged data structure
   - Ensure `dateTimestamp` is numeric (milliseconds)
   - Ensure `close` is numeric and > 0
4. **Test with Minimal Data**:
   - Try with just 2-3 data points to isolate the issue
   - Verify domain calculation works with minimal data

## Files Modified

- `src/components/chart/HistoricalChart.tsx` - Domain calculation, X-axis config, logging
- `src/components/ChartPreview.tsx` - Domain validation improvements
- `src/components/chart/PriceLayer.tsx` - Line rendering improvements

## Technical Details

### Domain Calculation Flow

1. `ChartPreview` calculates domain from all data (historical + forecast)
2. If calculation fails or returns invalid domain, returns `null`
3. `HistoricalChart` receives domain (or `null`)
4. If domain is invalid/null, `HistoricalChart` calculates from its own data
5. If that fails, uses `['auto', 'auto']` to let Recharts calculate

### Data Flow

1. Data comes from `chartData` atom (via `marketDataAtom`)
2. Processed in `ChartPreview` → `allChartData`
3. Passed to `HistoricalChart` as `data` prop
4. Filtered to `validData` (removes invalid points)
5. Passed to `ComposedChart` as `data` prop
6. Individual layers (PriceLayer, VolumeLayer, etc.) read from parent's data

### Recharts Data Binding

- `ComposedChart` has `data={validData}` prop
- Individual `Line`/`Bar` components use `dataKey` to access properties
- No explicit `data` prop on layers (they inherit from parent)
- `yAxisId` must match between Y-axis and layers

