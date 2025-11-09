# Forecasting Refactoring Summary

## Overview
Successfully separated forecasting into two distinct functions with clear model categories, improving code organization and maintainability.

## Changes Made

### 1. **New Forecasting Functions**

#### `generateShortTermForecast()`
- **Purpose**: Trend-based forecasting for short-term predictions (1-14 days)
- **Models**: `simple` (Simple MA), `arima` (ARIMA)
- **Best for**: Swing trading, short-term position management
- **Focus**: Recent price momentum, mean reversion, trend following

#### `generateLongTermForecast()`
- **Purpose**: Statistical/pattern-based forecasting for long-term predictions (7-90+ days)
- **Models**: `prophet` (Prophet), `lstm` (LSTM)
- **Best for**: Position sizing, longer-term trend identification
- **Focus**: Seasonal patterns, cyclical behavior, complex relationships

### 2. **Type System Updates**

Added new type definitions in `src/types/forecast.ts`:
- `ShortTermModel`: `'simple' | 'arima'`
- `LongTermModel`: `'prophet' | 'lstm'`
- `ForecastModel`: Union of both categories

### 3. **Helper Functions**

Added utility functions in `src/utils/forecasting.ts`:
- `isShortTermModel()`: Type guard for short-term models
- `isLongTermModel()`: Type guard for long-term models
- `getRecommendedForecastPeriod()`: Returns recommended periods for each model type

### 4. **Backward Compatibility**

Maintained `generateForecast()` function that routes to appropriate new function based on model type, ensuring existing code continues to work.

### 5. **Updated ChartPreview**

Modified `ChartPreview.tsx` to use the new separated functions:
- Short-term models now use `generateShortTermForecast()`
- Long-term models now use `generateLongTermForecast()`
- Improved code organization and clarity

## Benefits

1. **Clearer Separation of Concerns**: Short-term vs long-term logic is now distinct
2. **Better Error Handling**: Each function has appropriate validation and warnings
3. **Improved Maintainability**: Easier to modify or extend each category independently
4. **Better User Guidance**: Functions warn when forecast period doesn't match model type
5. **Type Safety**: New type definitions provide better TypeScript support

## Potential Issues Documented

Created `src/utils/forecasting-issues.md` documenting:
- Synchronous computation blocking UI
- Model selection complexity
- Inconsistent model behavior
- Memory leaks from cache
- Date validation edge cases
- Confidence interval calculation inconsistencies
- Hardcoded decay factors
- Lack of model performance tracking

## Files Modified

1. `src/utils/forecasting.ts` - Added new functions and helpers
2. `src/types/forecast.ts` - Added type definitions
3. `src/components/ChartPreview.tsx` - Updated to use new functions
4. `src/utils/forecasting-issues.md` - Created issue documentation

## Testing Recommendations

1. Test short-term models (simple, arima) with 1-14 day forecasts
2. Test long-term models (prophet, lstm) with 7-90 day forecasts
3. Verify warnings appear when using inappropriate forecast periods
4. Confirm backward compatibility with existing config
5. Test error handling with insufficient data

## Next Steps (Optional)

1. Consider making forecast computation async to avoid blocking UI
2. Add model performance tracking and comparison
3. Make decay factors adaptive based on volatility
4. Standardize confidence interval calculation across all models
5. Add UI to show model category recommendations

