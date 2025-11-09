import { OHLCVData } from '../types';
import { ForecastResult, ForecastConfig, ModelEvaluation, ShortTermModel, LongTermModel } from '../types/forecast';
import { normalize, denormalize, makeStationary } from './preprocessing';
import { parseISO, format, addDays, isValid, startOfDay, isAfter } from 'date-fns';
import { z } from 'zod';

/**
 * Helper function to determine if a model is short-term or long-term
 */
export function isShortTermModel(model: string): model is ShortTermModel {
  return model === 'simple' || model === 'arima';
}

/**
 * Helper function to determine if a model is long-term
 */
export function isLongTermModel(model: string): model is LongTermModel {
  return model === 'prophet' || model === 'lstm';
}

/**
 * Get recommended forecast period for a model type
 */
export function getRecommendedForecastPeriod(model: ShortTermModel | LongTermModel): { min: number; max: number; recommended: number } {
  if (isShortTermModel(model)) {
    return { min: 1, max: 14, recommended: 7 };
  } else {
    return { min: 7, max: 90, recommended: 30 };
  }
}

/**
 * Generate unified forecast dates for all models using date-fns
 * Ensures all forecasts align to the same future dates
 * Forecast dates start immediately after the last historical date
 */
export function generateForecastDates(
  lastDate: string,
  forecastDays: number
): string[] {
  const dates: string[] = [];
  
  // Parse the last historical date using date-fns
  let baseDate: Date;
  try {
    baseDate = startOfDay(parseISO(lastDate));
    if (!isValid(baseDate)) {
      console.error(`Invalid last date for forecast: ${lastDate}`);
      return [];
    }
  } catch (error) {
    console.error(`Error parsing last date: ${lastDate}`, error);
    return [];
  }
  
  // Ensure baseDate is a valid historical date (not more than 1 day in future)
  // Allow today's date to account for timezone differences
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  if (isAfter(baseDate, tomorrow)) {
    // Use today as base date instead - don't log as error, just adjust
    console.warn(`Last historical date (${lastDate}) is in the future. Using today as base date.`);
    baseDate = today;
  }
  
  // Generate forecast dates starting from the day after the last historical date
  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = startOfDay(addDays(baseDate, i));
    
    // Format as YYYY-MM-DD using date-fns
    dates.push(format(forecastDate, 'yyyy-MM-dd'));
  }
  
  return dates;
}

/**
 * Calculate forecast standard error from historical residuals
 * Uses rolling window of forecast errors to estimate prediction uncertainty
 * Returns standard error for confidence band calibration
 */
function calculateForecastStandardError(
  prices: number[],
  forecastFn: (historical: number[], horizon: number) => number[],
  forecastHorizon: number
): number {
  if (prices.length < 20) {
    // Fallback to volatility if insufficient data
    return Math.max(calculateVolatility(prices.slice(-30)), prices[prices.length - 1] * 0.01);
  }

  // Calculate in-sample forecast errors using rolling window
  const residuals: number[] = [];
  const window = Math.min(30, Math.floor(prices.length / 2));
  
  // Use rolling window to compute forecast errors
  for (let i = window; i < prices.length - forecastHorizon; i++) {
    const historicalPrices = prices.slice(0, i);
    const actuals = prices.slice(i, i + Math.min(forecastHorizon, prices.length - i));
    
    try {
      const forecasts = forecastFn(historicalPrices, actuals.length);
      for (let j = 0; j < Math.min(forecasts.length, actuals.length); j++) {
        const residual = actuals[j] - forecasts[j];
        residuals.push(residual);
      }
    } catch (error) {
      // Skip if forecast fails
      continue;
    }
  }

  if (residuals.length === 0) {
    return Math.max(calculateVolatility(prices.slice(-30)), prices[prices.length - 1] * 0.01);
  }

  // Calculate standard deviation of residuals (forecast standard error)
  const meanResidual = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const variance = residuals.reduce((sum, val) => sum + Math.pow(val - meanResidual, 2), 0) / residuals.length;
  const stdError = Math.sqrt(variance);

  // Ensure minimum standard error (at least 1% of current price)
  const minStdError = prices[prices.length - 1] * 0.01;
  
  return Math.max(stdError, minStdError);
}

/**
 * Calculate empirical standard error of moving average forecast (legacy)
 */
function calculateMAStandardError(
  prices: number[],
  maPeriod: number,
  forecastHorizon: number
): number {
  const forecastFn = (historical: number[], horizon: number) => {
    const window = Math.min(maPeriod, historical.length);
    const recentPrices = historical.slice(-window);
    const ma = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    return new Array(horizon).fill(ma);
  };
  
  return calculateForecastStandardError(prices, forecastFn, forecastHorizon);
}

/**
 * Zod schema for validating forecast results
 */
const forecastResultSchema = z.object({
  dates: z.array(z.string()),
  predicted: z.array(z.number()),
  lowerBound: z.array(z.number()),
  upperBound: z.array(z.number()),
  confidence: z.number(),
  direction: z.enum(['UP', 'DOWN', 'NEUTRAL']),
  bias: z.number(),
  model: z.string(),
});

/**
 * Validate forecast result using Zod
 * Ensures dates, predicted, upperBound, and lowerBound arrays have equal length
 */
function validateForecastResult(result: ForecastResult): ForecastResult {
  try {
    // Check array lengths match
    const lengths = [
      result.dates.length,
      result.predicted.length,
      result.lowerBound.length,
      result.upperBound.length,
    ];
    
    const minLength = Math.min(...lengths);
    const maxLength = Math.max(...lengths);
    
    // If all arrays are empty, return as-is (will be handled by ForecastPanel)
    if (minLength === 0 && maxLength === 0) {
      return result;
    }
    
    if (minLength !== maxLength) {
      console.warn(`Forecast result arrays have mismatched lengths. Truncating to minimum length: ${minLength}`);
      
      // If minLength is 0, return empty arrays
      if (minLength === 0) {
        return {
          ...result,
          dates: [],
          predicted: [],
          lowerBound: [],
          upperBound: [],
        };
      }
      
      // Truncate all arrays to minimum length
      return {
        ...result,
        dates: result.dates.slice(0, minLength),
        predicted: result.predicted.slice(0, minLength),
        lowerBound: result.lowerBound.slice(0, minLength),
        upperBound: result.upperBound.slice(0, minLength),
      };
    }
    
    // Validate with Zod schema
    forecastResultSchema.parse(result);
    return result;
  } catch (error) {
    console.error('Forecast result validation failed:', error);
    // Return result anyway but log the error
    return result;
  }
}

/**
 * Calculate prediction interval multiplier based on confidence level
 * Uses t-distribution approximation for small samples
 */
function getConfidenceMultiplier(confidenceLevel: number, sampleSize: number = 30): number {
  // Approximate t-quantiles for common confidence levels
  // For large samples, converges to normal distribution
  const zScores: Record<number, number> = {
    0.50: 0.674,
    0.68: 1.0,
    0.80: 1.282,
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  // Use exact z-score if available, otherwise interpolate
  if (zScores[confidenceLevel]) {
    return zScores[confidenceLevel];
  }

  // For small samples, use t-distribution approximation
  if (sampleSize < 30) {
    const tMultipliers: Record<number, number> = {
      0.50: 0.683,
      0.80: 1.310,
      0.90: 1.699,
      0.95: 2.045,
      0.99: 2.756,
    };
    return tMultipliers[confidenceLevel] || 1.96;
  }

  // Linear interpolation for intermediate values
  const levels = Object.keys(zScores).map(Number).sort((a, b) => a - b);
  const lower = levels.filter(l => l <= confidenceLevel).pop() || 0.95;
  const upper = levels.filter(l => l >= confidenceLevel).shift() || 0.99;
  
  if (lower === upper) return zScores[lower];
  
  const ratio = (confidenceLevel - lower) / (upper - lower);
  return zScores[lower] + ratio * (zScores[upper] - zScores[lower]);
}

/**
 * Simple Moving Average forecast (baseline)
 * Uses proper prediction intervals based on empirical standard error
 */
export function simpleMAForecast(
  data: OHLCVData[],
  period: number,
  forecastDays: number,
  confidenceLevel: number = 0.95
): ForecastResult {
  const prices = data.map(d => d.close);
  const dates = data.map(d => d.date);
  
  // Calculate moving average
  const window = Math.min(period, prices.length);
  
  // Simple trend estimation
  const recentTrend = prices.length >= 2 
    ? (prices[prices.length - 1] - prices[prices.length - window]) / window
    : 0;
  
  // Generate unified forecast dates
  const forecastDates = generateForecastDates(dates[dates.length - 1], forecastDays);
  
  // If no valid forecast dates, return empty forecast
  if (forecastDates.length === 0) {
    const direction: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    return {
      dates: [],
      predicted: [],
      lowerBound: [],
      upperBound: [],
      confidence: confidenceLevel,
      direction,
      bias: 0,
      model: 'Simple MA',
    };
  }
  
  // Calculate empirical standard error of MA forecast
  const stdError = calculateMAStandardError(prices, period, forecastDays);
  const confidenceMultiplier = getConfidenceMultiplier(confidenceLevel, prices.length);
  
  // Generate forecast
  const forecast: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  
  const lastPrice = prices[prices.length - 1];
  
  // Use exponential smoothing instead of linear extrapolation
  let currentPrice = lastPrice;
  const trendFactor = recentTrend / lastPrice; // Normalize as percentage
  
  for (let i = 1; i <= forecastDays; i++) {
    // Apply trend with decay to prevent perfectly linear forecast
    currentPrice = currentPrice * (1 + trendFactor * Math.exp(-i * 0.1));
    forecast.push(currentPrice);
    
    // Proper prediction intervals using standard error
    // Uncertainty increases with forecast horizon (square root scaling)
    const horizonStdError = stdError * Math.sqrt(i);
    const margin = confidenceMultiplier * horizonStdError;
    
    lower.push(Math.max(0, currentPrice - margin));
    upper.push(currentPrice + margin);
  }
  
  const direction: 'UP' | 'DOWN' | 'NEUTRAL' = recentTrend > 0 ? 'UP' : recentTrend < 0 ? 'DOWN' : 'NEUTRAL';
  const bias = Math.min(1, Math.max(-1, recentTrend / lastPrice * 100));
  
  const result: ForecastResult = {
    dates: forecastDates,
    predicted: forecast,
    lowerBound: lower,
    upperBound: upper,
    confidence: confidenceLevel,
    direction,
    bias,
    model: 'Simple MA',
  };
  
  return validateForecastResult(result);
}

/**
 * Fit ARIMA model parameters using Yule-Walker equations
 * Returns AR coefficients and MA coefficients
 */
function fitARIMA(
  stationarySeries: number[],
  arOrder: number,
  maOrder: number
): { arCoeffs: number[]; maCoeffs: number[]; residuals: number[] } {
  const n = stationarySeries.length;
  if (n < Math.max(arOrder, maOrder) + 10) {
    return { arCoeffs: [], maCoeffs: [], residuals: stationarySeries };
  }

  // Calculate autocorrelations
  const mean = stationarySeries.reduce((a, b) => a + b, 0) / n;
  const centered = stationarySeries.map(x => x - mean);
  
  const autocorr: number[] = [];
  const maxLag = Math.min(arOrder + maOrder, n - 1);
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = lag; i < n; i++) {
      sum += centered[i] * centered[i - lag];
    }
    autocorr.push(sum / (n - lag));
  }
  
  // Normalize autocorrelations
  const variance = autocorr[0];
  if (variance === 0) {
    return { arCoeffs: [], maCoeffs: [], residuals: stationarySeries };
  }
  
  const rho = autocorr.map(ac => ac / variance);
  
  // Solve Yule-Walker equations for AR coefficients (simplified)
  const arCoeffs: number[] = [];
  if (arOrder > 0 && rho.length > arOrder) {
    // Use first-order approximation: phi_1 ≈ rho[1]
    arCoeffs.push(Math.max(-0.99, Math.min(0.99, rho[1] || 0)));
    for (let i = 1; i < arOrder; i++) {
      // Higher order terms decay
      arCoeffs.push(arCoeffs[0] * Math.pow(0.5, i));
    }
  }
  
  // Calculate residuals (simplified MA component)
  const residuals: number[] = [...centered];
  if (arCoeffs.length > 0) {
    for (let i = arCoeffs.length; i < n; i++) {
      let arComponent = 0;
      for (let j = 0; j < arCoeffs.length; j++) {
        arComponent += arCoeffs[j] * centered[i - j - 1];
      }
      residuals[i] = centered[i] - arComponent;
    }
  }
  
  // MA coefficients (simplified - use residual autocorrelation)
  const maCoeffs: number[] = [];
  if (maOrder > 0) {
    const residualMean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const residualCentered = residuals.map(x => x - residualMean);
    let maSum = 0;
    for (let i = 1; i < Math.min(maOrder + 1, residualCentered.length); i++) {
      let sum = 0;
      for (let j = i; j < residualCentered.length; j++) {
        sum += residualCentered[j] * residualCentered[j - i];
      }
      maSum += sum / (residualCentered.length - i);
    }
    maCoeffs.push(Math.max(-0.5, Math.min(0.5, maSum / variance)));
  }
  
  return { arCoeffs, maCoeffs, residuals };
}

/**
 * ARIMA forecast with proper differencing, autoregressive, and moving-average components
 * Transforms non-stationary data to stationary series using differencing
 */
export function arimaForecast(
  data: OHLCVData[],
  forecastDays: number,
  confidenceLevel: number = 0.95
): ForecastResult {
  if (data.length < 20) {
    return simpleMAForecast(data, 20, forecastDays, confidenceLevel);
  }
  
  // Sort and validate dates using date-fns
  const sortedData = [...data].sort((a, b) => {
    try {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  });
  
  const sortedPrices = sortedData.map(d => d.close);
  const sortedDates = sortedData.map(d => d.date);
  
  // Generate unified forecast dates
  const forecastDates = generateForecastDates(sortedDates[sortedDates.length - 1], forecastDays);
  
  // If no valid forecast dates, return empty forecast
  if (forecastDates.length === 0) {
    const direction: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    return {
      dates: [],
      predicted: [],
      lowerBound: [],
      upperBound: [],
      confidence: confidenceLevel,
      direction,
      bias: 0,
      model: 'ARIMA',
    };
  }
  
  // Step 1: Make series stationary using differencing
  const { stationary, differences } = makeStationary(sortedPrices, 2);
  
  // Step 2: Fit ARIMA model (AR order, differencing, MA order)
  const arOrder = Math.min(3, Math.floor(stationary.length / 10));
  const maOrder = Math.min(2, Math.floor(stationary.length / 15));
  
  const { arCoeffs, residuals } = fitARIMA(stationary, arOrder, maOrder);
  
  // Step 3: Forecast stationary series
  const stationaryForecast: number[] = [];
  const lastStationary = stationary[stationary.length - 1];
  const recentStationary = stationary.slice(-Math.max(arOrder, 5));
  
  for (let i = 1; i <= forecastDays; i++) {
    let forecast = 0;
    
    // Autoregressive component
    if (arCoeffs.length > 0) {
      for (let j = 0; j < Math.min(arCoeffs.length, recentStationary.length); j++) {
        const idx = recentStationary.length - j - 1;
        if (idx >= 0) {
          forecast += arCoeffs[j] * recentStationary[idx];
        }
      }
    } else {
      // Fallback to mean if no AR coefficients
      forecast = lastStationary;
    }
    
    // Update recent values for next iteration
    recentStationary.push(forecast);
    if (recentStationary.length > 10) {
      recentStationary.shift();
    }
    
    stationaryForecast.push(forecast);
  }
  
  // Step 4: Reverse differencing to get price forecast
  let forecast: number[] = [...stationaryForecast];
  
  // Reverse the differencing operations
  for (let d = 0; d < differences; d++) {
    const reversed: number[] = [];
    const lastPrice = sortedPrices[sortedPrices.length - 1];
    
    for (let i = 0; i < forecast.length; i++) {
      if (i === 0) {
        reversed.push(lastPrice + forecast[i]);
      } else {
        reversed.push(reversed[i - 1] + forecast[i]);
      }
    }
    forecast = reversed;
  }
  
  // Step 5: Calculate confidence bands from residuals
  const residualStdError = Math.sqrt(
    residuals.reduce((sum, r) => sum + r * r, 0) / Math.max(1, residuals.length)
  );
  const confidenceMultiplier = getConfidenceMultiplier(confidenceLevel, sortedPrices.length);
  
  const lower: number[] = [];
  const upper: number[] = [];
  const lastPrice = sortedPrices[sortedPrices.length - 1];
  
  for (let i = 0; i < forecast.length; i++) {
    // Standard error increases with forecast horizon (square root scaling)
    const horizonStdError = residualStdError * Math.sqrt(i + 1);
    const margin = confidenceMultiplier * horizonStdError;
    
    lower.push(Math.max(0, forecast[i] - margin));
    upper.push(forecast[i] + margin);
  }
  
  // Calculate direction and bias
  const trend = forecast.length > 0 
    ? (forecast[forecast.length - 1] - lastPrice) / lastPrice
    : 0;
  const direction: 'UP' | 'DOWN' | 'NEUTRAL' = trend > 0.01 ? 'UP' : trend < -0.01 ? 'DOWN' : 'NEUTRAL';
  const bias = Math.min(1, Math.max(-1, trend * 100));
  
  // Validate result with Zod
  const result: ForecastResult = {
    dates: forecastDates,
    predicted: forecast,
    lowerBound: lower,
    upperBound: upper,
    confidence: confidenceLevel,
    direction,
    bias,
    model: 'ARIMA',
  };
  
  return validateForecastResult(result);
}

/**
 * Prophet-like forecast with additive trend and seasonality
 * Models seasonality and holidays for assets with clear cycles
 */
export function prophetForecast(
  data: OHLCVData[],
  forecastDays: number,
  confidenceLevel: number = 0.95
): ForecastResult {
  // Sort and validate dates using date-fns
  const sortedData = [...data].sort((a, b) => {
    try {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  });
  
  const prices = sortedData.map(d => d.close);
  const dates = sortedData.map(d => d.date);
  
  if (prices.length < 20) {
    return simpleMAForecast(data, 20, forecastDays, confidenceLevel);
  }
  
  // Generate unified forecast dates
  const forecastDates = generateForecastDates(dates[dates.length - 1], forecastDays);
  
  // If no valid forecast dates, return empty forecast
  if (forecastDates.length === 0) {
    const direction: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    return {
      dates: [],
      predicted: [],
      lowerBound: [],
      upperBound: [],
      confidence: confidenceLevel,
      direction,
      bias: 0,
      model: 'Prophet',
    };
  }
  
  // Detect trend using linear regression
  const trend = calculateTrend(prices);
  
  // Detect weekly and monthly seasonality
  const weeklySeasonality = detectSeasonality(prices, 7);
  const monthlySeasonality = prices.length >= 30 ? detectSeasonality(prices, 30) : 0;
  
  // Calculate historical residuals for confidence bands
  const residuals: number[] = [];
  const lastPrice = prices[prices.length - 1];
  const trendFactor = trend / lastPrice;
  
  // Calculate in-sample residuals
  for (let i = 20; i < prices.length; i++) {
    const historicalPrices = prices.slice(0, i);
    const historicalTrend = calculateTrend(historicalPrices);
    const historicalWeekly = detectSeasonality(historicalPrices, 7);
    
    const dayOfWeek = i % 7;
    const expectedPrice = historicalPrices[i - 1] + 
      (historicalPrices[i - 1] * historicalTrend / historicalPrices[i - 1]) +
      (historicalWeekly * Math.sin((2 * Math.PI * dayOfWeek) / 7));
    
    residuals.push(prices[i] - expectedPrice);
  }
  
  // Calculate forecast standard error from residuals
  const residualStdError = residuals.length > 0
    ? Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length)
    : Math.max(calculateVolatility(prices.slice(-30)), lastPrice * 0.01);
  
  const confidenceMultiplier = getConfidenceMultiplier(confidenceLevel, prices.length);
  
  const forecast: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  
  // Use additive model: price = trend + seasonality
  let currentPrice = lastPrice;
  
  for (let i = 1; i <= forecastDays; i++) {
    // Apply trend with decay (trend component)
    const trendComponent = currentPrice * trendFactor * Math.exp(-i * 0.02);
    
    // Apply weekly seasonality
    const dayOfWeek = (dates.length + i) % 7;
    const weeklyComponent = weeklySeasonality * Math.sin((2 * Math.PI * dayOfWeek) / 7);
    
    // Apply monthly seasonality if available
    const dayOfMonth = (dates.length + i) % 30;
    const monthlyComponent = monthlySeasonality * Math.sin((2 * Math.PI * dayOfMonth) / 30);
    
    currentPrice = currentPrice + trendComponent + weeklyComponent + monthlyComponent;
    forecast.push(currentPrice);
    
    // Confidence bands using residual standard error
    const horizonStdError = residualStdError * Math.sqrt(i);
    const margin = confidenceMultiplier * horizonStdError;
    
    lower.push(Math.max(0, currentPrice - margin));
    upper.push(currentPrice + margin);
  }
  
  const direction: 'UP' | 'DOWN' | 'NEUTRAL' = trend > 0 ? 'UP' : trend < 0 ? 'DOWN' : 'NEUTRAL';
  const bias = Math.min(1, Math.max(-1, trend / lastPrice * 100));
  
  const result: ForecastResult = {
    dates: forecastDates,
    predicted: forecast,
    lowerBound: lower,
    upperBound: upper,
    confidence: confidenceLevel,
    direction,
    bias,
    model: 'Prophet',
  };
  
  return validateForecastResult(result);
}

/**
 * LSTM-like forecast with sequence learning and memory cells
 * Uses memory cells to model long-range dependencies, addressing vanishing-gradient problem
 */
export function lstmForecast(
  data: OHLCVData[],
  forecastDays: number,
  confidenceLevel: number = 0.95
): ForecastResult {
  // Sort and validate dates using date-fns
  const sortedData = [...data].sort((a, b) => {
    try {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  });
  
  const prices = sortedData.map(d => d.close);
  const dates = sortedData.map(d => d.date);
  
  if (prices.length < 30) {
    return simpleMAForecast(data, 20, forecastDays, confidenceLevel);
  }
  
  // Generate unified forecast dates
  const forecastDates = generateForecastDates(dates[dates.length - 1], forecastDays);
  
  // If no valid forecast dates, return empty forecast
  if (forecastDates.length === 0) {
    const direction: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    return {
      dates: [],
      predicted: [],
      lowerBound: [],
      upperBound: [],
      confidence: confidenceLevel,
      direction,
      bias: 0,
      model: 'LSTM',
    };
  }
  
  // Normalize prices for LSTM processing
  const { normalized, min, max } = normalize(prices);
  
  // LSTM sequence learning: use sliding window with memory
  const sequenceLength = Math.min(20, Math.floor(prices.length / 3));
  const recentSequence = normalized.slice(-sequenceLength);
  
  // Simulate LSTM memory cells with forget gate, input gate, and output gate
  // Memory cell stores long-term dependencies
  let memoryCell = 0;
  let hiddenState = recentSequence[recentSequence.length - 1];
  
  // Initialize memory from recent sequence
  for (let i = 0; i < recentSequence.length; i++) {
    const forgetGate = Math.exp(-i * 0.1); // Decay older memories
    const inputGate = 1 - forgetGate;
    memoryCell = memoryCell * forgetGate + recentSequence[i] * inputGate;
  }
  
  // Calculate historical residuals for confidence bands
  const residuals: number[] = [];
  const lastPrice = prices[prices.length - 1];
  
  // Calculate in-sample residuals using LSTM-like predictions
  for (let i = sequenceLength; i < prices.length; i++) {
    const historicalSequence = normalized.slice(i - sequenceLength, i);
    let memCell = 0;
    let hidden = historicalSequence[historicalSequence.length - 1];
    
    for (let j = 0; j < historicalSequence.length; j++) {
      const forgetGate = Math.exp(-j * 0.1);
      const inputGate = 1 - forgetGate;
      memCell = memCell * forgetGate + historicalSequence[j] * inputGate;
    }
    
    // Predict next value using memory and hidden state
    const predictedNormalized = hidden * 0.7 + memCell * 0.3;
    const predictedPrice = denormalize([predictedNormalized], min, max)[0];
    
    residuals.push(prices[i] - predictedPrice);
  }
  
  // Calculate forecast standard error from residuals
  const residualStdError = residuals.length > 0
    ? Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length)
    : Math.max(calculateVolatility(prices.slice(-30)), lastPrice * 0.01);
  
  const confidenceMultiplier = getConfidenceMultiplier(confidenceLevel, prices.length);
  
  const forecast: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  
  // Forecast using LSTM memory cells
  let currentNormalized = hiddenState;
  let currentMemory = memoryCell;
  
  for (let i = 1; i <= forecastDays; i++) {
    // LSTM gates
    const forgetGate = 0.9; // Retain most of memory
    const inputGate = 0.1; // Small update from current state
    const outputGate = 0.8; // Output most of hidden state
    
    // Update memory cell (long-term dependencies)
    currentMemory = currentMemory * forgetGate + currentNormalized * inputGate;
    
    // Update hidden state (short-term dependencies)
    currentNormalized = currentNormalized * outputGate + currentMemory * (1 - outputGate);
    
    // Denormalize to get price forecast
    const forecastNormalized = currentNormalized;
    const forecastPrice = denormalize([forecastNormalized], min, max)[0];
    
    forecast.push(forecastPrice);
    
    // Confidence bands using residual standard error
    // LSTM has higher uncertainty due to complexity
    const horizonStdError = residualStdError * Math.sqrt(i) * 1.2;
    const margin = confidenceMultiplier * horizonStdError;
    
    lower.push(Math.max(0, forecastPrice - margin));
    upper.push(forecastPrice + margin);
  }
  
  // Calculate direction and bias
  const trend = forecast.length > 0 
    ? (forecast[forecast.length - 1] - lastPrice) / lastPrice
    : 0;
  const direction: 'UP' | 'DOWN' | 'NEUTRAL' = trend > 0.01 ? 'UP' : trend < -0.01 ? 'DOWN' : 'NEUTRAL';
  const bias = Math.min(1, Math.max(-1, trend * 100));
  
  const result: ForecastResult = {
    dates: forecastDates,
    predicted: forecast,
    lowerBound: lower,
    upperBound: upper,
    confidence: confidenceLevel,
    direction,
    bias,
    model: 'LSTM',
  };
  
  return validateForecastResult(result);
}

/**
 * Calculate volatility (standard deviation of returns)
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

/**
 * Calculate linear trend
 */
function calculateTrend(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const n = prices.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * Detect seasonality pattern
 */
function detectSeasonality(prices: number[], period: number): number {
  if (prices.length < period * 2) return 0;
  
  const cycles = Math.floor(prices.length / period);
  let seasonalSum = 0;
  
  for (let i = 0; i < period; i++) {
    let cycleSum = 0;
    for (let j = 0; j < cycles; j++) {
      const idx = j * period + i;
      if (idx < prices.length && idx > 0) {
        cycleSum += prices[idx] - prices[idx - 1];
      }
    }
    seasonalSum += cycleSum / cycles;
  }
  
  return seasonalSum / period;
}

/**
 * Evaluate model performance
 */
export function evaluateModel(
  actual: number[],
  predicted: number[],
  actualDirections: ('UP' | 'DOWN' | 'NEUTRAL')[],
  predictedDirections: ('UP' | 'DOWN' | 'NEUTRAL')[]
): ModelEvaluation {
  if (actual.length !== predicted.length) {
    return { rmse: Infinity, mae: Infinity, directionalAccuracy: 0, cumulativeReturn: 0 };
  }
  
  // RMSE
  const squaredErrors = actual.map((a, i) => Math.pow(a - predicted[i], 2));
  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / actual.length);
  
  // MAE
  const absoluteErrors = actual.map((a, i) => Math.abs(a - predicted[i]));
  const mae = absoluteErrors.reduce((a, b) => a + b, 0) / actual.length;
  
  // Directional accuracy
  let correctDirections = 0;
  for (let i = 0; i < actualDirections.length; i++) {
    if (actualDirections[i] === predictedDirections[i]) {
      correctDirections++;
    }
  }
  const directionalAccuracy = actualDirections.length > 0 
    ? correctDirections / actualDirections.length 
    : 0;
  
  // Cumulative return (simulated)
  let cumulativeReturn = 0;
  for (let i = 1; i < actual.length; i++) {
    const actualReturn = (actual[i] - actual[i - 1]) / actual[i - 1];
    const predictedReturn = (predicted[i] - predicted[i - 1]) / predicted[i - 1];
    if (predictedReturn > 0 && actualReturn > 0) {
      cumulativeReturn += actualReturn;
    } else if (predictedReturn < 0 && actualReturn < 0) {
      cumulativeReturn -= Math.abs(actualReturn);
    }
  }
  
  return { rmse, mae, directionalAccuracy, cumulativeReturn };
}

/**
 * Generate short-term forecast using trend-based models
 * Best for: 1-7 day forecasts
 * Models: Simple MA (trend-following), ARIMA (mean reversion + trend)
 * 
 * These models focus on recent price momentum and short-term patterns.
 * They work well for swing trading and short-term position management.
 */
export function generateShortTermForecast(
  data: OHLCVData[],
  model: 'simple' | 'arima',
  forecastDays: number,
  confidenceLevel: number = 0.95
): ForecastResult | null {
  if (data.length < 10) {
    console.warn('Insufficient data for short-term forecast. Need at least 10 data points.');
    return null;
  }

  // Validate forecast period is appropriate for short-term
  if (forecastDays > 14) {
    console.warn(`Short-term forecast requested for ${forecastDays} days. Consider using long-term forecast for periods > 14 days.`);
  }

  try {
    switch (model) {
      case 'arima':
        return arimaForecast(data, forecastDays, confidenceLevel);
      case 'simple':
      default:
        return simpleMAForecast(data, 20, forecastDays, confidenceLevel);
    }
  } catch (error) {
    console.error('Error generating short-term forecast:', error);
    return null;
  }
}

/**
 * Generate long-term forecast using statistical/pattern models
 * Best for: 7-30+ day forecasts
 * Models: Prophet (seasonality + trend), LSTM (complex patterns)
 * 
 * These models detect seasonal patterns, cyclical behavior, and complex
 * relationships in price data. They work well for position sizing and
 * longer-term trend identification.
 */
export function generateLongTermForecast(
  data: OHLCVData[],
  model: 'prophet' | 'lstm',
  forecastDays: number,
  confidenceLevel: number = 0.95
): ForecastResult | null {
  if (data.length < 20) {
    console.warn('Insufficient data for long-term forecast. Need at least 20 data points.');
    return null;
  }

  // Validate forecast period is appropriate for long-term
  if (forecastDays < 7) {
    console.warn(`Long-term forecast requested for ${forecastDays} days. Consider using short-term forecast for periods < 7 days.`);
  }

  try {
    switch (model) {
      case 'prophet':
        return prophetForecast(data, forecastDays, confidenceLevel);
      case 'lstm':
        return lstmForecast(data, forecastDays, confidenceLevel);
      default:
        return prophetForecast(data, forecastDays, confidenceLevel);
    }
  } catch (error) {
    console.error('Error generating long-term forecast:', error);
    return null;
  }
}

/**
 * Generate forecast based on config (legacy function for backward compatibility)
 * Now routes to appropriate function based on model type
 */
export function generateForecast(
  data: OHLCVData[],
  config: ForecastConfig
): ForecastResult | null {
  if (!config.enabled || data.length < 10) {
    return null;
  }
  
  // Route to appropriate function based on model category
  const shortTermModels: Array<'simple' | 'arima'> = ['simple', 'arima'];
  const longTermModels: Array<'prophet' | 'lstm'> = ['prophet', 'lstm'];
  
  if (shortTermModels.includes(config.model as 'simple' | 'arima')) {
    return generateShortTermForecast(
      data,
      config.model as 'simple' | 'arima',
      config.forecastPeriod,
      config.confidenceLevel
    );
  } else if (longTermModels.includes(config.model as 'prophet' | 'lstm')) {
    return generateLongTermForecast(
      data,
      config.model as 'prophet' | 'lstm',
      config.forecastPeriod,
      config.confidenceLevel
    );
  }
  
  // Fallback to simple MA
  return generateShortTermForecast(data, 'simple', config.forecastPeriod, config.confidenceLevel);
}

