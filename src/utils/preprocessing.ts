import { OHLCVData } from '../types';

/**
 * Calculate log returns for stationarity
 */
export function calculateLogReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    } else {
      returns.push(0);
    }
  }
  return returns;
}

/**
 * Calculate first difference for stationarity
 */
export function calculateFirstDifference(values: number[]): number[] {
  const diff: number[] = [];
  for (let i = 1; i < values.length; i++) {
    diff.push(values[i] - values[i - 1]);
  }
  return diff;
}

/**
 * Simple Augmented Dickey-Fuller test (simplified version)
 * Returns approximate p-value indication
 */
export function testStationarity(series: number[]): { isStationary: boolean; pValue: number } {
  if (series.length < 10) {
    return { isStationary: false, pValue: 1 };
  }

  // Simplified ADF test - check variance and mean stability
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const variance = series.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / series.length;
  
  // Split into two halves and compare
  const mid = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, mid);
  const secondHalf = series.slice(mid);
  
  const mean1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const mean2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const meanDiff = Math.abs(mean1 - mean2);
  const stdDev = Math.sqrt(variance);
  
  // If mean difference is small relative to std dev, likely stationary
  const isStationary = meanDiff < stdDev * 0.5;
  const pValue = isStationary ? 0.05 : 0.5; // Simplified
  
  return { isStationary, pValue };
}

/**
 * Make series stationary using differencing
 */
export function makeStationary(prices: number[], maxDiffs: number = 2): {
  stationary: number[];
  differences: number;
} {
  let current = [...prices];
  let diffs = 0;
  
  for (let i = 0; i < maxDiffs; i++) {
    const { isStationary } = testStationarity(current);
    if (isStationary) break;
    
    current = calculateFirstDifference(current);
    diffs++;
  }
  
  return { stationary: current, differences: diffs };
}

/**
 * Prepare data for forecasting
 */
export function prepareForecastData(data: OHLCVData[]): {
  prices: number[];
  dates: string[];
  returns: number[];
  stationary: number[];
} {
  const prices = data.map(d => d.close);
  const dates = data.map(d => d.date);
  const returns = calculateLogReturns(prices);
  const { stationary } = makeStationary(prices);
  
  return { prices, dates, returns, stationary };
}

/**
 * Normalize data to 0-1 range
 */
export function normalize(values: number[]): { normalized: number[]; min: number; max: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) {
    return { normalized: values.map(() => 0.5), min, max };
  }
  
  const normalized = values.map(v => (v - min) / range);
  return { normalized, min, max };
}

/**
 * Denormalize data
 */
export function denormalize(normalized: number[], min: number, max: number): number[] {
  const range = max - min;
  return normalized.map(v => v * range + min);
}

