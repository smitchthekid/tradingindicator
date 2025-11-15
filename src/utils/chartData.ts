/**
 * Chart data processing utilities
 * Centralized functions for data transformation, sorting, and normalization
 */

export interface ChartDataPoint {
  date: string;
  fullDate: string;
  dateTimestamp: number;
  close: number;
  high: number;
  low: number;
  open?: number;
  volume?: number;
  isHistorical: boolean;
  isUpDay?: boolean;
  ema?: number;
  upperBand?: number;
  lowerBand?: number;
  atr?: number;
  atrStopLossDistance?: number;
  atrStopLossLong?: number;
  atrStopLossShort?: number;
  stopLoss?: number;
  signal?: string;
  signalType?: string;
  signalPrice?: number;
  signalStopLoss?: number;
  signalTarget?: number;
}

/**
 * Normalize date to midnight for accurate comparison
 */
export function normalizeDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const normalized = new Date(d);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Sort chart data points by timestamp
 */
export function sortChartDataByTimestamp<T extends { dateTimestamp?: number; fullDate?: string }>(
  data: T[]
): T[] {
  return [...data].sort((a, b) => {
    const timeA = a.dateTimestamp || (a.fullDate ? new Date(a.fullDate).getTime() : 0);
    const timeB = b.dateTimestamp || (b.fullDate ? new Date(b.fullDate).getTime() : 0);
    return timeA - timeB;
  });
}

/**
 * Filter out invalid or future dates
 */
export function filterValidHistoricalData<T extends { date?: string; fullDate?: string }>(
  data: T[],
  maxDate: Date = new Date()
): T[] {
  return data.filter((item: T) => {
    if (!item.date && !item.fullDate) return false;
    
    const dateStr = item.fullDate || item.date;
    if (!dateStr) return false;
    
    const dateObj = new Date(dateStr);
    
    if (isNaN(dateObj.getTime())) return false;
    if (dateObj > maxDate) return false;
    
    return true;
  });
}

/**
 * Calculate Y-axis domain from price data
 */
export function calculateYDomain(
  prices: number[],
  paddingPercent: number = 0.05
): [number, number] {
  if (prices.length === 0) return [0, 100];
  
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  
  const min = Math.max(0, median - 2 * stdDev);
  const max = median + 2 * stdDev;
  const padding = (max - min) * paddingPercent;
  
  return [min - padding, max + padding];
}

/**
 * Calculate volume domain
 */
export function calculateVolumeDomain(volumes: number[]): [number, number] {
  const validVolumes = volumes.filter((vol) => !isNaN(vol) && vol > 0);
  if (validVolumes.length === 0) return [0, 100];
  
  const maxVolume = Math.max(...validVolumes);
  return [0, maxVolume];
}

/**
 * Calculate ATR domain
 */
export function calculateATRDomain(atrs: number[]): [number, number] {
  const validATRs = atrs.filter((atr) => !isNaN(atr) && atr > 0);
  if (validATRs.length === 0) return [0, 100];
  
  const maxATR = Math.max(...validATRs);
  const minATR = Math.min(...validATRs);
  const padding = (maxATR - minATR) * 0.1;
  
  return [Math.max(0, minATR - padding), maxATR + padding];
}

/**
 * Calculate ATR thresholds for background shading
 */
export function calculateATRThresholds(atrs: number[]): { high: number | null; medium: number | null } {
  const validATRs = atrs.filter((atr) => !isNaN(atr) && atr > 0);
  if (validATRs.length === 0) return { high: null, medium: null };
  
  const sorted = [...validATRs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const q75 = sorted[Math.floor(sorted.length * 0.75)];
  
  return {
    high: q75,
    medium: median,
  };
}

