/**
 * Represents a single, processed data point for the chart.
 * All layers will use this data structure.
 */
export interface ChartDataPoint {
  dateTimestamp: number; // Used for XAxis
  close: number;         // Price data
  volume?: number;
  ema?: number;
  isUpDay?: boolean;
  isForecast?: boolean;  // Whether this is forecasted data
}

/**
 * Forecast data point
 */
export interface ForecastPoint {
  dateTimestamp: number;
  predicted: number;
  lowerBound?: number;
  upperBound?: number;
}

/**
 * Buy/Sell signal indicator
 */
export interface SignalIndicator {
  dateTimestamp: number;
  type: 'BUY' | 'SELL';
  price: number;
  isForecast?: boolean; // Whether this signal is for forecasted data
}

/**
 * Fibonacci retracement level
 */
export interface FibonacciLevel {
  level: number;
  percentage: number; // 0, 23.6, 38.2, 50, 61.8, 78.6, 100
  label: string;
}

/**
 * Props for any chart layer component.
 */
export interface ChartLayerProps {
  data: ChartDataPoint[];
}

/**
 * Props for forecast layer
 */
export interface ForecastLayerProps {
  forecastData: ForecastPoint[];
}

/**
 * Props for signals layer
 */
export interface SignalsLayerProps {
  signals: SignalIndicator[];
}

/**
 * Props for Fibonacci levels layer
 */
export interface FibonacciLayerProps {
  levels: FibonacciLevel[];
  dataRange: { min: number; max: number };
}

