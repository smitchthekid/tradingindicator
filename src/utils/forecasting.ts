import { OHLCVData } from '../types';
import { ForecastResult, ForecastConfig, ModelEvaluation } from '../types/forecast';
import { prepareForecastData, normalize, denormalize, testStationarity } from './preprocessing';

/**
 * Generate unified forecast dates for all models
 * Ensures all forecasts align to the same future dates
 * Forecast dates start immediately after the last historical date
 */
export function generateForecastDates(
  lastDate: string,
  forecastDays: number
): string[] {
  const dates: string[] = [];
  
  // Parse the last historical date
  const baseDate = new Date(lastDate);
  if (isNaN(baseDate.getTime())) {
    console.error(`Invalid last date for forecast: ${lastDate}`);
    return [];
  }
  
  // Ensure baseDate is a valid historical date (not in future)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (baseDate > today) {
    console.error(`Last historical date is in the future: ${lastDate}`);
    return [];
  }
  
  // Generate forecast dates starting from the day after the last historical date
  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(baseDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    // Format as YYYY-MM-DD
    const year = forecastDate.getFullYear();
    const month = String(forecastDate.getMonth() + 1).padStart(2, '0');
    const day = String(forecastDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
}

/**
 * Calculate empirical standard error of moving average forecast
 * Uses rolling window of forecast errors to estimate prediction uncertainty
 */
function calculateMAStandardError(
  prices: number[],
  maPeriod: number,
  forecastHorizon: number
): number {
  if (prices.length < maPeriod + 5) {
    // Fallback to volatility if insufficient data
    return Math.max(calculateVolatility(prices.slice(-30)), prices[prices.length - 1] * 0.01);
  }

  // Calculate in-sample forecast errors using rolling window
  const errors: number[] = [];
  const window = Math.min(maPeriod, Math.floor(prices.length / 2));
  
  // Use rolling window to compute forecast errors
  for (let i = window; i < prices.length - 1; i++) {
    const historicalPrices = prices.slice(i - window, i);
    const ma = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    const actual = prices[i + 1];
    const error = Math.abs(actual - ma);
    errors.push(error);
  }

  if (errors.length === 0) {
    return Math.max(calculateVolatility(prices.slice(-30)), prices[prices.length - 1] * 0.01);
  }

  // Calculate standard deviation of forecast errors
  const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
  const variance = errors.reduce((sum, val) => sum + Math.pow(val - meanError, 2), 0) / errors.length;
  const stdError = Math.sqrt(variance);

  // Adjust for forecast horizon (uncertainty increases with time)
  // Use square root scaling for heteroscedastic data
  const horizonAdjustment = Math.sqrt(forecastHorizon);
  
  // Ensure minimum standard error (at least 1% of current price)
  const minStdError = prices[prices.length - 1] * 0.01;
  
  return Math.max(stdError * horizonAdjustment, minStdError);
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
  const recentPrices = prices.slice(-window);
  const ma = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
  
  // Simple trend estimation
  const recentTrend = prices.length >= 2 
    ? (prices[prices.length - 1] - prices[prices.length - window]) / window
    : 0;
  
  // Generate unified forecast dates
  const forecastDates = generateForecastDates(dates[dates.length - 1], forecastDays);
  
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
  
  const direction = recentTrend > 0 ? 'UP' : recentTrend < 0 ? 'DOWN' : 'NEUTRAL';
  const bias = Math.min(1, Math.max(-1, recentTrend / lastPrice * 100));
  
  return {
    dates: forecastDates,
    predicted: forecast,
    lowerBound: lower,
    upperBound: upper,
    confidence: confidenceLevel,
    direction,
    bias,
    model: 'Simple MA',
  };
}

/**
 * ARIMA-like forecast (simplified)
 */
export function arimaForecast(
  data: OHLCVData[],
  forecastDays: number,
  confidenceLevel: number = 0.95
): ForecastResult {
  const { prices, dates, returns } = prepareForecastData(data);
  
  if (prices.length < 10) {
    return simpleMAForecast(data, 20, forecastDays, confidenceLevel);
  }
  
  // Generate unified forecast dates
  const forecastDates = generateForecastDates(dates[dates.length - 1], forecastDays);
  
  // Simplified ARIMA: Use autoregressive component
  const arOrder = Math.min(5, Math.floor(prices.length / 4));
  const recentReturns = returns.slice(-arOrder);
  const avgReturn = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
  
  const forecast: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  
  const lastPrice = prices[prices.length - 1];
  const volatility = Math.max(calculateVolatility(prices.slice(-30)), lastPrice * 0.01);
  const confidenceMultiplier = getConfidenceMultiplier(confidenceLevel, prices.length);

  // Forecast using exponential smoothing of returns
  let currentPrice = lastPrice;
  for (let i = 1; i <= forecastDays; i++) {
    // Apply mean reversion with trend
    const expectedReturn = avgReturn * Math.exp(-i * 0.1); // Decay factor
    currentPrice = currentPrice * Math.exp(expectedReturn);
    
    forecast.push(currentPrice);
    
    // Confidence intervals with proper scaling
    const stdDev = Math.max(volatility * Math.sqrt(i), lastPrice * 0.015);
    const margin = confidenceMultiplier * stdDev;
    lower.push(Math.max(0, currentPrice - margin));
    upper.push(currentPrice + margin);
  }
  
  const direction = avgReturn > 0 ? 'UP' : avgReturn < 0 ? 'DOWN' : 'NEUTRAL';
  const bias = Math.min(1, Math.max(-1, avgReturn * 100));
  
  return {
    dates: forecastDates,
    predicted: forecast,
    lowerBound: lower,
    upperBound: upper,
    confidence: confidenceLevel,
    direction,
    bias,
    model: 'ARIMA',
  };
}

/**
 * Prophet-like forecast (simplified with trend and seasonality)
 */
export function prophetForecast(
  data: OHLCVData[],
  forecastDays: number,
  confidenceLevel: number = 0.95
): ForecastResult {
  const { prices, dates } = prepareForecastData(data);
  
  if (prices.length < 20) {
    return simpleMAForecast(data, 20, forecastDays, confidenceLevel);
  }
  
  // Generate unified forecast dates
  const forecastDates = generateForecastDates(dates[dates.length - 1], forecastDays);
  
  // Detect trend
  const trend = calculateTrend(prices);
  
  // Detect weekly seasonality (simplified)
  const seasonality = detectSeasonality(prices, 7);
  
  const forecast: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  
  const lastPrice = prices[prices.length - 1];
  const volatility = Math.max(calculateVolatility(prices.slice(-30)), lastPrice * 0.01);
  const confidenceMultiplier = getConfidenceMultiplier(confidenceLevel, prices.length);

  // Use cumulative approach instead of linear
  let currentPrice = lastPrice;
  const trendFactor = trend / lastPrice; // Normalize trend
  
  for (let i = 1; i <= forecastDays; i++) {
    // Apply trend with decay and seasonality
    const trendComponent = currentPrice * trendFactor * Math.exp(-i * 0.05);
    const seasonalComponent = seasonality * Math.sin((2 * Math.PI * i) / 7);
    currentPrice = currentPrice + trendComponent + seasonalComponent;
    
    forecast.push(currentPrice);
    
    const stdDev = Math.max(volatility * Math.sqrt(i), lastPrice * 0.015);
    const margin = confidenceMultiplier * stdDev;
    lower.push(Math.max(0, currentPrice - margin));
    upper.push(currentPrice + margin);
  }
  
  const direction = trend > 0 ? 'UP' : trend < 0 ? 'DOWN' : 'NEUTRAL';
  const bias = Math.min(1, Math.max(-1, trend / lastPrice * 100));
  
  return {
    dates: forecastDates,
    predicted: forecast,
    lowerBound: lower,
    upperBound: upper,
    confidence: confidenceLevel,
    direction,
    bias,
    model: 'Prophet',
  };
}

/**
 * LSTM-like forecast (simplified neural network approach)
 */
export function lstmForecast(
  data: OHLCVData[],
  forecastDays: number,
  confidenceLevel: number = 0.95
): ForecastResult {
  const { prices, dates } = prepareForecastData(data);
  
  if (prices.length < 30) {
    return simpleMAForecast(data, 20, forecastDays, confidenceLevel);
  }
  
  // Generate unified forecast dates
  const forecastDates = generateForecastDates(dates[dates.length - 1], forecastDays);
  
  // Simplified LSTM: Use sequence learning with exponential weighted moving average
  const sequenceLength = Math.min(10, Math.floor(prices.length / 3));
  const recentSequence = prices.slice(-sequenceLength);
  
  // Calculate weighted average with decay (simulating LSTM memory)
  let weightedSum = 0;
  let weightSum = 0;
  for (let i = 0; i < recentSequence.length; i++) {
    const weight = Math.exp(-i * 0.1); // Exponential decay
    weightedSum += recentSequence[i] * weight;
    weightSum += weight;
  }
  const basePrice = weightedSum / weightSum;
  
  // Trend from sequence
  const trend = (recentSequence[recentSequence.length - 1] - recentSequence[0]) / sequenceLength;
  
  const forecast: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  
  const lastPrice = prices[prices.length - 1];
  const volatility = Math.max(calculateVolatility(prices.slice(-30)), lastPrice * 0.01);
  const confidenceMultiplier = getConfidenceMultiplier(confidenceLevel, prices.length);
  
  // Use exponential smoothing for more realistic forecast
  let currentPrice = lastPrice;
  const trendFactor = trend / lastPrice; // Normalize trend as percentage
  
  for (let i = 1; i <= forecastDays; i++) {
    // Apply mean reversion gradually with decay
    const meanReversion = (basePrice - currentPrice) * 0.05; // Reduced from 0.1
    // Apply trend with exponential decay to prevent linear extrapolation
    const trendComponent = currentPrice * trendFactor * Math.exp(-i * 0.05);
    currentPrice = currentPrice + meanReversion + trendComponent;
    
    forecast.push(currentPrice);
    
    // Confidence intervals that widen over time (LSTM has higher uncertainty)
    const stdDev = Math.max(volatility * Math.sqrt(i) * 1.2, lastPrice * 0.02);
    const margin = confidenceMultiplier * stdDev;
    lower.push(Math.max(0, currentPrice - margin));
    upper.push(currentPrice + margin);
  }
  
  const direction = trend > 0 ? 'UP' : trend < 0 ? 'DOWN' : 'NEUTRAL';
  const bias = Math.min(1, Math.max(-1, trend / lastPrice * 100));
  
  return {
    dates: forecastDates,
    predicted: forecast,
    lowerBound: lower,
    upperBound: upper,
    confidence: confidenceLevel,
    direction,
    bias,
    model: 'LSTM',
  };
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
 * Generate forecast based on config
 * Now uses proper prediction intervals and unified dates
 */
export function generateForecast(
  data: OHLCVData[],
  config: ForecastConfig
): ForecastResult | null {
  if (!config.enabled || data.length < 10) {
    return null;
  }
  
  switch (config.model) {
    case 'arima':
      return arimaForecast(data, config.forecastPeriod, config.confidenceLevel);
    case 'prophet':
      return prophetForecast(data, config.forecastPeriod, config.confidenceLevel);
    case 'lstm':
      return lstmForecast(data, config.forecastPeriod, config.confidenceLevel);
    case 'simple':
    default:
      return simpleMAForecast(data, 20, config.forecastPeriod, config.confidenceLevel);
  }
}

