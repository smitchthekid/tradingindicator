/**
 * Custom hook for forecast management
 * Centralizes forecast state and computation logic
 */

import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import {
  forecastModelAtom,
  forecastEnabledAtom,
  forecastPeriodAtom,
  forecastConfidenceAtom,
  simpleForecastAtom,
  arimaForecastAtom,
  prophetForecastAtom,
  lstmForecastAtom,
  forecastLoadingAtom,
  forecastErrorAtom,
  forecastCache,
} from '../atoms/forecast';
import { generateShortTermForecast, generateLongTermForecast } from '../utils/forecasting';
import { OHLCVData } from '../types';
import { IndicatorConfig } from '../types';
import { scheduleIdleCallback, scheduleTasks } from '../utils/scheduler';
import { logger } from '../utils/logger';

export function useForecasts(
  marketData: OHLCVData[],
  config: IndicatorConfig
) {
  const [forecastModel, setForecastModel] = useAtom(forecastModelAtom);
  const [forecastEnabled, setForecastEnabled] = useAtom(forecastEnabledAtom);
  const [forecastPeriod, setForecastPeriod] = useAtom(forecastPeriodAtom);
  const [forecastConfidence, setForecastConfidence] = useAtom(forecastConfidenceAtom);
  
  const [simpleForecast, setSimpleForecast] = useAtom(simpleForecastAtom);
  const [arimaForecast, setArimaForecast] = useAtom(arimaForecastAtom);
  const [prophetForecast, setProphetForecast] = useAtom(prophetForecastAtom);
  const [lstmForecast, setLstmForecast] = useAtom(lstmForecastAtom);
  
  const [, setForecastLoading] = useAtom(forecastLoadingAtom);
  const [, setForecastError] = useAtom(forecastErrorAtom);
  
  const lastSymbolRef = useRef<string>('');
  
  // Sync config with atoms
  useEffect(() => {
    if (config.forecast.enabled !== forecastEnabled) {
      setForecastEnabled(config.forecast.enabled);
    }
    if (config.forecast.model !== forecastModel) {
      setForecastModel(config.forecast.model);
    }
    if (config.forecast.forecastPeriod !== forecastPeriod) {
      setForecastPeriod(config.forecast.forecastPeriod);
    }
    if (config.forecast.confidenceLevel !== forecastConfidence) {
      setForecastConfidence(config.forecast.confidenceLevel);
    }
  }, [
    config.forecast,
    forecastEnabled,
    forecastModel,
    forecastPeriod,
    forecastConfidence,
    setForecastEnabled,
    setForecastModel,
    setForecastPeriod,
    setForecastConfidence,
  ]);
  
  // Evict cache when symbol changes
  useEffect(() => {
    if (config.symbol && config.symbol !== lastSymbolRef.current) {
      forecastCache.evictSymbol(config.symbol);
      lastSymbolRef.current = config.symbol;
    }
  }, [config.symbol]);
  
  // Compute forecasts
  useEffect(() => {
    if (!forecastEnabled) {
      setSimpleForecast(null);
      setArimaForecast(null);
      setProphetForecast(null);
      setLstmForecast(null);
      return;
    }
    
    if (marketData.length < 10) {
      setSimpleForecast(null);
      setArimaForecast(null);
      setProphetForecast(null);
      setLstmForecast(null);
      return;
    }
    
    setForecastLoading(true);
    setForecastError(null);
    
    const computeForecasts = () => {
      try {
        const symbol = config.symbol;
        const period = forecastPeriod;
        const confidence = forecastConfidence;
        
        // Compute short-term forecasts first (faster)
        const cachedSimple = forecastCache.get('simple', symbol, marketData, period, confidence);
        if (cachedSimple) {
          setSimpleForecast(cachedSimple);
        } else {
          const simpleResult = generateShortTermForecast(marketData, 'simple', period, confidence);
          if (simpleResult) {
            forecastCache.set('simple', symbol, marketData, period, confidence, simpleResult);
            setSimpleForecast(simpleResult);
          }
        }
        
        // Schedule remaining forecasts with delays
        const cleanup = scheduleTasks([
          {
            callback: () => {
              const cachedArima = forecastCache.get('arima', symbol, marketData, period, confidence);
              if (cachedArima) {
                setArimaForecast(cachedArima);
              } else {
                const arimaResult = generateShortTermForecast(marketData, 'arima', period, confidence);
                if (arimaResult) {
                  forecastCache.set('arima', symbol, marketData, period, confidence, arimaResult);
                  setArimaForecast(arimaResult);
                }
              }
            },
            delay: 0,
          },
          {
            callback: () => {
              const cachedProphet = forecastCache.get('prophet', symbol, marketData, period, confidence);
              if (cachedProphet) {
                setProphetForecast(cachedProphet);
              } else {
                const prophetResult = generateLongTermForecast(marketData, 'prophet', period, confidence);
                if (prophetResult) {
                  forecastCache.set('prophet', symbol, marketData, period, confidence, prophetResult);
                  setProphetForecast(prophetResult);
                }
              }
            },
            delay: 10,
          },
          {
            callback: () => {
              const cachedLstm = forecastCache.get('lstm', symbol, marketData, period, confidence);
              if (cachedLstm) {
                setLstmForecast(cachedLstm);
              } else {
                const lstmResult = generateLongTermForecast(marketData, 'lstm', period, confidence);
                if (lstmResult) {
                  forecastCache.set('lstm', symbol, marketData, period, confidence, lstmResult);
                  setLstmForecast(lstmResult);
                }
              }
              setForecastLoading(false);
            },
            delay: 20,
          },
        ]);
        
        return cleanup;
      } catch (error) {
        logger.error('Error computing forecasts:', error);
        setForecastError(error instanceof Error ? error.message : 'Failed to compute forecasts');
        setForecastLoading(false);
        return () => {};
      }
    };
    
    const cleanup = scheduleIdleCallback(computeForecasts, { timeout: 100 });
    
    return () => {
      if (typeof cleanup === 'number') {
        // If it's a timeout handle, clear it
        window.clearTimeout(cleanup);
      }
    };
  }, [
    marketData,
    forecastPeriod,
    forecastConfidence,
    forecastEnabled,
    config.symbol,
    setSimpleForecast,
    setArimaForecast,
    setProphetForecast,
    setLstmForecast,
    setForecastLoading,
    setForecastError,
  ]);
  
  // Get active forecast based on model
  const activeForecast = forecastEnabled
    ? (forecastModel === 'arima' ? arimaForecast :
       forecastModel === 'prophet' ? prophetForecast :
       forecastModel === 'lstm' ? lstmForecast :
       simpleForecast)
    : null;
  
  return {
    forecastModel,
    forecastEnabled,
    forecastPeriod,
    forecastConfidence,
    simpleForecast,
    arimaForecast,
    prophetForecast,
    lstmForecast,
    activeForecast,
  };
}

