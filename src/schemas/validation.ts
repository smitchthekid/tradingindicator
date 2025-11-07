import { z } from 'zod';

export const indicatorConfigSchema = z.object({
  ema: z.object({
    enabled: z.boolean(),
    period: z.number().min(1).max(200),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  atr: z.object({
    enabled: z.boolean(),
    period: z.number().min(1).max(200),
    multiplier: z.number().min(0.1).max(10),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  volatilityBands: z.object({
    enabled: z.boolean(),
    period: z.number().min(1).max(200),
    multiplier: z.number().min(0.1).max(10),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  riskManagement: z.object({
    accountSize: z.number().min(0),
    riskPercentage: z.number().min(0).max(100),
    atrStopLossMultiplier: z.number().min(0.1).max(10),
  }),
  symbol: z.string().min(1),
  apiKey: z.string().min(1),
  apiProvider: z.enum(['alphavantage', 'eodhd']),
  proMode: z.boolean(),
  forecast: z.object({
    enabled: z.boolean(),
    model: z.enum(['arima', 'prophet', 'lstm', 'simple']),
    forecastPeriod: z.number().min(1).max(90),
    confidenceLevel: z.number().min(0.5).max(0.99),
  }),
});

export type IndicatorConfigInput = z.infer<typeof indicatorConfigSchema>;

