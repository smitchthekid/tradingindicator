import { OHLCVData, CalculatedIndicators, IndicatorConfig } from '../types';

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: OHLCVData[], period: number): number[] {
  if (data.length === 0 || period < 1) return [];
  
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < Math.min(period, data.length); i++) {
    sum += data[i].close;
  }
  ema[period - 1] = sum / period;
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i].close - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  return ema;
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(data: OHLCVData[], period: number): number[] {
  if (data.length === 0 || period < 1) return [];
  
  const trueRanges: number[] = [];
  
  // Calculate True Range for each period
  for (let i = 1; i < data.length; i++) {
    const tr1 = data[i].high - data[i].low;
    const tr2 = Math.abs(data[i].high - data[i - 1].close);
    const tr3 = Math.abs(data[i].low - data[i - 1].close);
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  const atr: number[] = new Array(data.length).fill(NaN);
  
  // Calculate ATR using SMA for first period, then EMA
  if (trueRanges.length < period) return atr;
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trueRanges[i];
  }
  atr[period] = sum / period;
  
  const multiplier = 2 / (period + 1);
  for (let i = period + 1; i < data.length; i++) {
    atr[i] = (trueRanges[i - 1] - atr[i - 1]) * multiplier + atr[i - 1];
  }
  
  return atr;
}

/**
 * Calculate Volatility Bands (based on standard deviation)
 */
export function calculateVolatilityBands(
  data: OHLCVData[],
  period: number,
  multiplier: number
): { upper: number[]; lower: number[] } {
  if (data.length === 0 || period < 1) return { upper: [], lower: [] };
  
  const closes = data.map(d => d.close);
  const upper: number[] = new Array(data.length).fill(NaN);
  const lower: number[] = new Array(data.length).fill(NaN);
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    upper[i] = mean + (stdDev * multiplier);
    lower[i] = mean - (stdDev * multiplier);
  }
  
  return { upper, lower };
}

/**
 * Calculate all indicators based on config
 */
export function calculateIndicators(
  data: OHLCVData[],
  config: IndicatorConfig
): CalculatedIndicators {
  const result: CalculatedIndicators = {
    ema: [],
    atr: [],
    upperBand: [],
    lowerBand: [],
    stopLoss: [],
    positionSize: 0,
  };
  
  if (data.length === 0) return result;
  
  // Calculate EMA
  if (config.ema.enabled) {
    result.ema = calculateEMA(data, config.ema.period);
  }
  
  // Calculate ATR
  if (config.atr.enabled) {
    result.atr = calculateATR(data, config.atr.period);
  }
  
  // Calculate Volatility Bands
  if (config.volatilityBands.enabled) {
    const bands = calculateVolatilityBands(
      data,
      config.volatilityBands.period,
      config.volatilityBands.multiplier
    );
    result.upperBand = bands.upper;
    result.lowerBand = bands.lower;
  }
  
  // Calculate ATR-based stop loss
  if (config.atr.enabled && result.atr.length > 0) {
    const latestATR = result.atr[result.atr.length - 1];
    const latestClose = data[data.length - 1].close;
    const stopLossPrice = latestClose - (latestATR * config.riskManagement.atrStopLossMultiplier);
    
    result.stopLoss = new Array(data.length).fill(NaN);
    result.stopLoss[data.length - 1] = stopLossPrice;
  }
  
  // Calculate position size
  if (config.atr.enabled && result.atr.length > 0 && result.stopLoss.length > 0) {
    const latestATR = result.atr[result.atr.length - 1];
    const riskAmount = (config.riskManagement.accountSize * config.riskManagement.riskPercentage) / 100;
    const stopLossDistance = latestATR * config.riskManagement.atrStopLossMultiplier;
    
    if (stopLossDistance > 0) {
      result.positionSize = Math.floor(riskAmount / stopLossDistance);
    }
  }
  
  return result;
}

