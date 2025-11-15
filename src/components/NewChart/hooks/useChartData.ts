// src/components/NewChart/hooks/useChartData.ts

import { useState, useEffect, useMemo } from 'react';
import { ChartDataPoint, ForecastPoint, SignalIndicator, FibonacciLevel } from '../types';

// --- MOCK DATA ---
// In a real application, you would fetch this from an API.
const MOCK_API_DATA = Array.from({ length: 50 }, (_, i) => {
  const open = 100 + i + Math.random() * 10;
  const close = 100 + i + Math.random() * 10 + (Math.random() > 0.5 ? 2 : -2);
  return {
    date: new Date(2025, 0, i + 1).getTime(),
    open,
    close,
    volume: 10000 + Math.random() * 5000,
  };
});

// Mock forecast data
const MOCK_FORECAST_DATA = Array.from({ length: 10 }, (_, i) => {
  const lastPrice = MOCK_API_DATA[MOCK_API_DATA.length - 1].close;
  const trend = 1 + (i * 0.02); // Slight upward trend
  const noise = (Math.random() - 0.5) * 5;
  return {
    date: new Date(2025, 0, MOCK_API_DATA.length + i + 1).getTime(),
    predicted: lastPrice * trend + noise,
    lowerBound: (lastPrice * trend + noise) * 0.95,
    upperBound: (lastPrice * trend + noise) * 1.05,
  };
});

// Mock signals (buy/sell indicators)
const MOCK_SIGNALS: Array<{ date: number; type: 'BUY' | 'SELL'; price: number; isForecast?: boolean }> = [
  { date: MOCK_API_DATA[10].date, type: 'BUY', price: MOCK_API_DATA[10].close, isForecast: false },
  { date: MOCK_API_DATA[25].date, type: 'SELL', price: MOCK_API_DATA[25].close, isForecast: false },
  { date: MOCK_API_DATA[35].date, type: 'BUY', price: MOCK_API_DATA[35].close, isForecast: false },
  { date: MOCK_FORECAST_DATA[3].date, type: 'SELL', price: MOCK_FORECAST_DATA[3].predicted, isForecast: true },
  { date: MOCK_FORECAST_DATA[7].date, type: 'BUY', price: MOCK_FORECAST_DATA[7].predicted, isForecast: true },
];
// --- END MOCK DATA ---

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
 * A hook to fetch and process chart data.
 * It returns the processed data along with loading and error states.
 */
export const useChartData = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [signals, setSignals] = useState<SignalIndicator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate Fibonacci levels from the data
  const fibonacciLevels = useMemo(() => {
    if (data.length === 0) return [];
    return calculateFibonacciLevels(data);
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, replace MOCK_API_DATA with an API call.
        const rawData = await Promise.resolve(MOCK_API_DATA);
        const rawForecast = await Promise.resolve(MOCK_FORECAST_DATA);
        const rawSignals = await Promise.resolve(MOCK_SIGNALS);

        // Single transformation step
        const filteredAndSorted = rawData
          .filter(d => d.close && d.date) // Ensure essential data exists
          .sort((a, b) => a.date - b.date); // Sort by date

        // Calculate EMA iteratively since each value depends on the previous
        const processedData: ChartDataPoint[] = [];
        for (let i = 0; i < filteredAndSorted.length; i++) {
          const d = filteredAndSorted[i];
          const prev = filteredAndSorted[i - 1];
          const prevClose = prev?.close ?? d.close;
          const prevEma = processedData[i - 1]?.ema ?? prevClose;
          // Simple EMA calculation for demonstration
          const ema = i > 0 
            ? (d.close * 0.1 + prevEma * 0.9)
            : d.close;
          processedData.push({
            dateTimestamp: d.date,
            close: d.close,
            volume: d.volume,
            isUpDay: d.close >= prevClose,
            ema: ema,
            isForecast: false,
          });
        }

        // Process forecast data
        const processedForecast: ForecastPoint[] = rawForecast
          .map(f => ({
            dateTimestamp: f.date,
            predicted: f.predicted,
            lowerBound: f.lowerBound,
            upperBound: f.upperBound,
          }))
          .sort((a, b) => a.dateTimestamp - b.dateTimestamp);

        // Process signals
        const processedSignals: SignalIndicator[] = rawSignals.map(s => ({
          dateTimestamp: s.date,
          type: s.type,
          price: s.price,
          isForecast: s.isForecast ?? false,
        }));

        setData(processedData);
        setForecastData(processedForecast);
        setSignals(processedSignals);
      } catch (err) {
        setError('Failed to fetch chart data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { 
    data, 
    forecastData, 
    signals, 
    fibonacciLevels,
    loading, 
    error 
  };
};

