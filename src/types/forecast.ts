// Model type definitions
export type ShortTermModel = 'simple' | 'arima';
export type LongTermModel = 'prophet' | 'lstm';
export type ForecastModel = ShortTermModel | LongTermModel;

export interface ForecastConfig {
  enabled: boolean;
  model: ForecastModel;
  forecastPeriod: number; // days to forecast
  confidenceLevel: number; // 0-1, e.g., 0.95 for 95% confidence
}

export interface ForecastResult {
  dates: string[];
  predicted: number[];
  lowerBound: number[];
  upperBound: number[];
  confidence: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  bias: number; // -1 to 1, negative = bearish, positive = bullish
  model: string;
  metrics?: {
    rmse?: number;
    mae?: number;
    directionalAccuracy?: number;
  };
}

export interface ModelEvaluation {
  rmse: number;
  mae: number;
  directionalAccuracy: number;
  cumulativeReturn: number;
}

