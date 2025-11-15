export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorConfig {
  // EMA Settings
  ema: {
    enabled: boolean;
    period: number;
    color: string;
  };
  // ATR Settings
  atr: {
    enabled: boolean;
    period: number;
    multiplier: number;
    color: string;
  };
  // Volatility Bands
  volatilityBands: {
    enabled: boolean;
    period: number;
    multiplier: number;
    color: string;
  };
  // Risk Management
  riskManagement: {
    accountSize: number;
    riskPercentage: number;
    atrStopLossMultiplier: number;
  };
  // Symbol
  symbol: string;
  apiKey?: string; // Optional, not needed for Yahoo Finance
  apiProvider: 'yahoo';
  // UI Settings
  proMode: boolean;
  // Forecasting
  forecast: {
    enabled: boolean;
    model: 'arima' | 'prophet' | 'lstm' | 'simple';
    forecastPeriod: number;
    confidenceLevel: number;
  };
}

export interface CalculatedIndicators {
  ema: number[];
  atr: number[];
  upperBand: number[];
  lowerBand: number[];
  stopLoss: number[];
  positionSize: number;
}

export interface Preset {
  id: string;
  name: string;
  config: IndicatorConfig;
  createdAt: string;
}

export interface TradingSignal {
  index: number;
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  stopLoss: number;
  target: number;
  riskRewardRatio: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reason: string;
}

export interface SupportResistance {
  level: number;
  type: 'support' | 'resistance';
  strength: number; // 1-5
  touches: number;
}

export interface RiskMetrics {
  accountSize: number;
  riskPercentage: number;
  riskAmount: number;
  positionSize: number;
  stopLossDistance: number;
  stopLossPrice: number;
  entryPrice: number;
  targetPrice: number;
  riskRewardRatio: number;
  recommendedTarget: number; // Based on 1:3 R:R minimum
}

