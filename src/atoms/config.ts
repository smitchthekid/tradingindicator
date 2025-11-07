import { atom } from 'jotai';
import { z } from 'zod';
import { IndicatorConfig } from '../types';
import { indicatorConfigSchema } from '../schemas/validation';

export const defaultConfig: IndicatorConfig = {
  ema: {
    enabled: true,
    period: 20,
    color: '#3B82F6',
  },
  atr: {
    enabled: true,
    period: 14,
    multiplier: 2.0,
    color: '#EF4444',
  },
  volatilityBands: {
    enabled: true,
    period: 20,
    multiplier: 2.0,
    color: '#10B981',
  },
  riskManagement: {
    accountSize: 5000,
    riskPercentage: 2,
    atrStopLossMultiplier: 2.0,
  },
  symbol: 'BTC',
  apiKey: 'NKGY112HJBSEHUQV',
  apiProvider: 'alphavantage',
  proMode: false,
  forecast: {
    enabled: false,
    model: 'simple',
    forecastPeriod: 7,
    confidenceLevel: 0.95,
  },
};

// Load from localStorage or use default
const loadConfig = (): IndicatorConfig => {
  try {
    const stored = localStorage.getItem('indicator-config');
    if (stored) {
      const parsed = JSON.parse(stored);
      const validated = indicatorConfigSchema.parse(parsed);
      return validated as IndicatorConfig;
    }
  } catch (error) {
    console.warn('Failed to load config from localStorage:', error);
  }
  return defaultConfig;
};

export const configAtom = atom<IndicatorConfig>(loadConfig());

// Derived atom for validation errors
export const validationErrorsAtom = atom((get) => {
  const config = get(configAtom);
  try {
    indicatorConfigSchema.parse(config);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors;
    }
    return null;
  }
});

// Persist config to localStorage whenever it changes
export const persistConfigAtom = atom(
  null,
  (get, set, update: IndicatorConfig) => {
    set(configAtom, update);
    try {
      localStorage.setItem('indicator-config', JSON.stringify(update));
    } catch (error) {
      console.warn('Failed to persist config to localStorage:', error);
    }
  }
);

