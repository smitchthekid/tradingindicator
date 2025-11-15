// src/components/NewChart/hooks/useChartData.ts

import { useMemo } from 'react';
import { useAtom } from 'jotai';
import { ChartDataPoint, ForecastPoint, SignalIndicator, FibonacciLevel } from '../types';
import { marketDataAtom } from '../../../atoms/data';
import { 
  simpleForecastAtom, 
  arimaForecastAtom, 
  prophetForecastAtom, 
  lstmForecastAtom,
  forecastModelAtom,
} from '../../../atoms/forecast';
import { ForecastResult } from '../../../types/forecast';
import { TradingSignal } from '../../../types';
import { useIndicators } from '../../../hooks/useIndicators';
import { configAtom } from '../../../atoms/config';
import { normalizeDate } from '../../../utils/chartData';

/**
 * Convert ForecastResult to ForecastPoint array
 */
function convertForecastToPoints(forecast: ForecastResult | null, lastHistoricalDate?: Date): ForecastPoint[] {
  if (!forecast || !forecast.dates.length || !lastHistoricalDate) {
    return [];
  }

  const points: ForecastPoint[] = [];
  
  for (let idx = 0; idx < forecast.dates.length; idx++) {
    const date = forecast.dates[idx];
    const dateObj = normalizeDate(date);
    
    // Only include future dates
    if (dateObj.getTime() <= lastHistoricalDate.getTime()) {
      continue;
    }
    
    if (idx >= forecast.predicted.length) continue;
    
    const predicted = forecast.predicted[idx];
    const lower = forecast.lowerBound?.[idx];
    const upper = forecast.upperBound?.[idx];
    
    if (isNaN(predicted)) continue;
    
    points.push({
      dateTimestamp: dateObj.getTime(),
      predicted,
      lowerBound: lower && !isNaN(lower) ? lower : undefined,
      upperBound: upper && !isNaN(upper) ? upper : undefined,
    });
  }
  
  return points.sort((a, b) => a.dateTimestamp - b.dateTimestamp);
}

/**
 * Convert TradingSignal to SignalIndicator
 */
function convertSignalsToIndicators(signals: TradingSignal[], lastHistoricalDate?: Date): SignalIndicator[] {
  if (!signals || signals.length === 0) return [];
  
  return signals.map(signal => {
    const signalDate = normalizeDate(signal.date);
    const isForecast = lastHistoricalDate ? signalDate.getTime() > lastHistoricalDate.getTime() : false;
    
    return {
      dateTimestamp: signalDate.getTime(),
      type: signal.type,
      price: signal.price,
      isForecast,
    };
  });
}

/**
 * Calculate Fibonacci retracement levels
 * Based on the high and low of the data range
 */
function calculateFibonacciLevels(data: ChartDataPoint[]): FibonacciLevel[] {
  if (data.length === 0) return [];

  const prices = data.map(d => d.close);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const diff = high - low;

  // Standard Fibonacci retracement levels
  const percentages = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
  const labels = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];

  return percentages.map((pct, idx) => ({
    level: high - (diff * pct),
    percentage: pct * 100,
    label: labels[idx],
  }));
}

/**
 * A hook to process chart data from real market data
 */
export const useChartData = () => {
  const [marketData] = useAtom(marketDataAtom);
  const [config] = useAtom(configAtom);
  const [forecastModel] = useAtom(forecastModelAtom);
  const [simpleForecast] = useAtom(simpleForecastAtom);
  const [arimaForecast] = useAtom(arimaForecastAtom);
  const [prophetForecast] = useAtom(prophetForecastAtom);
  const [lstmForecast] = useAtom(lstmForecastAtom);
  
  // Get indicators and signals
  const { indicators, signals } = useIndicators(marketData, config);

  // Get active forecast based on selected model
  const activeForecast = useMemo(() => {
    if (forecastModel === 'arima') return arimaForecast;
    if (forecastModel === 'prophet') return prophetForecast;
    if (forecastModel === 'lstm') return lstmForecast;
    return simpleForecast;
  }, [forecastModel, simpleForecast, arimaForecast, prophetForecast, lstmForecast]);

  // Process market data into chart data points
  const data = useMemo(() => {
    if (!marketData || marketData.length === 0) return [];
    
    const processedData: ChartDataPoint[] = [];
    for (let i = 0; i < marketData.length; i++) {
      const d = marketData[i];
      const prev = marketData[i - 1];
      const prevClose = prev?.close ?? d.close;
      
      // Get EMA from indicators if available
      const ema = indicators?.ema?.[i];
      
      processedData.push({
        dateTimestamp: normalizeDate(d.date).getTime(),
        close: d.close,
        volume: d.volume,
        isUpDay: d.close >= prevClose,
        ema: ema && !isNaN(ema) ? ema : undefined,
        isForecast: false,
      });
    }
    
    return processedData;
  }, [marketData, indicators]);

  // Process forecast data
  const forecastData = useMemo(() => {
    if (!activeForecast || !marketData || marketData.length === 0) return [];
    
    const lastDate = normalizeDate(marketData[marketData.length - 1].date);
    return convertForecastToPoints(activeForecast, lastDate);
  }, [activeForecast, marketData]);

  // Process signals
  const processedSignals = useMemo(() => {
    if (!signals || signals.length === 0 || !marketData || marketData.length === 0) return [];
    
    const lastDate = normalizeDate(marketData[marketData.length - 1].date);
    return convertSignalsToIndicators(signals, lastDate);
  }, [signals, marketData]);

  // Calculate Fibonacci levels
  const fibonacciLevels = useMemo(() => {
    if (data.length === 0) return [];
    return calculateFibonacciLevels(data);
  }, [data]);

  const loading = marketData.length === 0;
  const error = null; // Errors are handled at the app level

  return { 
    data, 
    forecastData, 
    signals: processedSignals, 
    fibonacciLevels,
    loading, 
    error 
  };
};
