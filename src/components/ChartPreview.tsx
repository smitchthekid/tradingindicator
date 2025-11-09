import React, { useEffect, useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { configAtom, persistConfigAtom } from '../atoms/config';
import { marketDataAtom, indicatorsAtom, loadingAtom, errorAtom } from '../atoms/data';
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
import { fetchMarketData } from '../services/api';
import { calculateIndicators } from '../utils/calculations';
import { getCachedData } from '../utils/cache';
import { generateSignals, detectSupportResistance, calculateRiskMetrics } from '../utils/signals';
import { TradingSignal, SupportResistance, RiskMetrics } from '../types';
import { 
  generateShortTermForecast,
  generateLongTermForecast,
} from '../utils/forecasting';
import { ForecastResult } from '../types/forecast';
import { SignalsPanel } from './SignalsPanel';
import { ForecastPanel } from './ForecastPanel';
import { MetricsTabs } from './MetricsTabs';
import { SingleModelChart } from './SingleModelChart';
import './ChartPreview.css';

export const ChartPreview: React.FC = () => {
  const [config, setConfig] = useAtom(configAtom);
  const [, persistConfig] = useAtom(persistConfigAtom);
  const [marketData, setMarketData] = useAtom(marketDataAtom);
  const [indicators, setIndicators] = useAtom(indicatorsAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [lastSymbol, setLastSymbol] = useState<string>('');
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [supportResistance, setSupportResistance] = useState<SupportResistance[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  
  // Forecast atoms
  const [forecastModel, setForecastModel] = useAtom(forecastModelAtom);
  const [forecastEnabled, setForecastEnabled] = useAtom(forecastEnabledAtom);
  const [forecastPeriod, setForecastPeriod] = useAtom(forecastPeriodAtom);
  const [forecastConfidence, setForecastConfidence] = useAtom(forecastConfidenceAtom);
  const [simpleForecast] = useAtom(simpleForecastAtom);
  const [arimaForecast] = useAtom(arimaForecastAtom);
  const [prophetForecast] = useAtom(prophetForecastAtom);
  const [lstmForecast] = useAtom(lstmForecastAtom);
  const [, setSimpleForecast] = useAtom(simpleForecastAtom);
  const [, setArimaForecast] = useAtom(arimaForecastAtom);
  const [, setProphetForecast] = useAtom(prophetForecastAtom);
  const [, setLstmForecast] = useAtom(lstmForecastAtom);
  const [, setForecastLoading] = useAtom(forecastLoadingAtom);
  const [, setForecastError] = useAtom(forecastErrorAtom);

  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    if (!config.symbol || !config.apiKey) {
      setError('Please enter a symbol and API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchMarketData(
        config.symbol,
        config.apiKey,
        config.apiProvider,
        forceRefresh
      );

      if (response.error) {
        setError(response.error);
        setMarketData([]);
        setIndicators(null);
      } else {
        if (response.data.length === 0) {
          setError('No data returned. Check symbol format and API key.');
          setMarketData([]);
          setIndicators(null);
        } else {
          // Log received data for debugging
          console.log(`ChartPreview: Received ${response.data.length} data points`);
          if (response.data.length > 0) {
            console.log(`Date range: ${response.data[0].date} to ${response.data[response.data.length - 1].date}`);
          }
          
          // Check if we only have 1 day of data - likely an issue
          if (response.data.length <= 1) {
            console.warn('Warning: Only received 1 day of data. This may indicate an API limitation or error.');
            setError('Only received today\'s data. The API may be rate-limited or the symbol may not be supported. Try refreshing or switching providers.');
          }
          
          setMarketData(response.data);
          const calculated = calculateIndicators(response.data, config);
          setIndicators(calculated);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setMarketData([]);
      setIndicators(null);
    } finally {
      setLoading(false);
    }
  }, [config, setLoading, setError, setMarketData, setIndicators]);

  // Initial load on mount
  useEffect(() => {
    if (config.symbol && config.apiKey && marketData.length === 0) {
      // Check for cached data first
      const cached = getCachedData(config.symbol, config.apiProvider);
      if (cached && cached.length > 0) {
        setMarketData(cached);
        const calculated = calculateIndicators(cached, config);
        setIndicators(calculated);
      } else {
        // Auto-fetch if no cache exists
        loadData(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load cached data on symbol/provider change (debounced)
  useEffect(() => {
    if (config.symbol !== lastSymbol && config.symbol && config.apiKey) {
      setLastSymbol(config.symbol);
      
      // Check for cached data first
      const cached = getCachedData(config.symbol, config.apiProvider);
      if (cached && cached.length > 0) {
        setMarketData(cached);
        const calculated = calculateIndicators(cached, config);
        setIndicators(calculated);
      } else {
        // Only auto-fetch if no cache exists
        const timer = setTimeout(() => {
          loadData(false);
        }, 500); // Debounce 500ms
        
        return () => clearTimeout(timer);
      }
    }
  }, [config.symbol, config.apiProvider, lastSymbol, config, setMarketData, setIndicators, loadData]);

  // Sync config.forecast with atomic forecast state
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
  }, [config.forecast, forecastEnabled, forecastModel, forecastPeriod, forecastConfidence, setForecastEnabled, setForecastModel, setForecastPeriod, setForecastConfidence]);

  // Compute and cache forecasts for all models when data changes
  useEffect(() => {
    if (marketData.length < 10) {
      // Clear forecasts if insufficient data
      setSimpleForecast(null);
      setArimaForecast(null);
      setProphetForecast(null);
      setLstmForecast(null);
      return;
    }

    setForecastLoading(true);
    setForecastError(null);

    try {
      const symbol = config.symbol;
      const period = forecastPeriod;
      const confidence = forecastConfidence;

      // Compute forecasts using new separated functions
      // Short-term models (trend-based)
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

      // Long-term models (statistical/pattern-based)
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
    } catch (error) {
      console.error('Error computing forecasts:', error);
      setForecastError(error instanceof Error ? error.message : 'Failed to compute forecasts');
    } finally {
      setForecastLoading(false);
    }
  }, [marketData, forecastPeriod, forecastConfidence, config.symbol, setSimpleForecast, setArimaForecast, setProphetForecast, setLstmForecast, setForecastLoading, setForecastError]);

  // Evict cache when symbol changes
  useEffect(() => {
    if (config.symbol && config.symbol !== lastSymbol) {
      forecastCache.evictSymbol(config.symbol);
    }
  }, [config.symbol, lastSymbol]);

  // Recalculate indicators, signals, and risk metrics when config changes
  useEffect(() => {
    if (marketData.length > 0) {
      try {
        const calculated = calculateIndicators(marketData, config);
        // Only update if we got valid indicators with data
        if (calculated && calculated.ema && Array.isArray(calculated.ema) && calculated.ema.length > 0) {
          setIndicators(calculated);
          
          // Generate signals
          const newSignals = generateSignals(marketData, calculated, config);
          setSignals(newSignals);
          
          // Calculate risk metrics
          const latestSignal = newSignals.length > 0 ? newSignals[newSignals.length - 1] : null;
          const metrics = calculateRiskMetrics(
            marketData,
            calculated,
            config,
            latestSignal?.price,
            latestSignal?.target
          );
          setRiskMetrics(metrics);
        }
        
        // Detect support/resistance (doesn't depend on indicators)
        const sr = detectSupportResistance(marketData);
        setSupportResistance(sr);
      } catch (error) {
        console.error('Error calculating indicators:', error);
        // Don't clear indicators on error - keep previous values to prevent flickering
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.ema.enabled,
    config.ema.period,
    config.ema.color,
    config.atr.enabled,
    config.atr.period,
    config.atr.multiplier,
    config.atr.color,
    config.volatilityBands.enabled,
    config.volatilityBands.period,
    config.volatilityBands.multiplier,
    config.volatilityBands.color,
    config.riskManagement.accountSize,
    config.riskManagement.riskPercentage,
    config.riskManagement.atrStopLossMultiplier,
    marketData,
  ]);

  // Historical data mapping - only includes actual historical prices and indicators
  // Validate dates are not in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const chartData = marketData
    .map((data, index) => {
      if (!data || isNaN(data.close)) return null;
      
      // Validate date is not in the future
      const dateObj = new Date(data.date);
      if (isNaN(dateObj.getTime())) {
        console.warn(`Invalid date in market data: ${data.date}`);
        return null;
      }
      
      // Skip future dates (historical data only)
      if (dateObj > today) {
        console.warn(`Skipping future date in historical data: ${data.date}`);
        return null;
      }
      
      const point: any = {
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fullDate: data.date,
        dateTimestamp: dateObj.getTime(), // For sorting
        close: data.close,
        high: data.high || data.close,
        low: data.low || data.close,
        isHistorical: true, // Mark as historical data
      };

      // Add signal markers
      if (signals && signals.length > 0) {
        const signalAtThisIndex = signals.find(s => s && s.index === index);
        if (signalAtThisIndex) {
          point.signal = signalAtThisIndex.type;
          point.signalType = signalAtThisIndex.type;
          point.signalPrice = signalAtThisIndex.price;
          point.signalStopLoss = signalAtThisIndex.stopLoss;
          point.signalTarget = signalAtThisIndex.target;
        }
      }

      // Add indicators
      if (indicators) {
        if (config.ema.enabled && indicators.ema && indicators.ema[index] !== undefined && !isNaN(indicators.ema[index])) {
          point.ema = indicators.ema[index];
        }
        if (config.volatilityBands.enabled) {
          if (indicators.upperBand && indicators.upperBand[index] !== undefined && !isNaN(indicators.upperBand[index])) {
            point.upperBand = indicators.upperBand[index];
          }
          if (indicators.lowerBand && indicators.lowerBand[index] !== undefined && !isNaN(indicators.lowerBand[index])) {
            point.lowerBand = indicators.lowerBand[index];
          }
        }
        if (config.atr.enabled && indicators.atr && indicators.atr[index] !== undefined && !isNaN(indicators.atr[index])) {
          point.atr = indicators.atr[index];
        }
        if (indicators.stopLoss && indicators.stopLoss[index] !== undefined && !isNaN(indicators.stopLoss[index])) {
          if (!point.signalStopLoss) {
            point.stopLoss = indicators.stopLoss[index];
          }
        }
      }

      return point;
    })
    .filter(Boolean) // Remove any null entries
    .sort((a, b) => {
      // Sort by timestamp to ensure chronological order
      const timeA = a.dateTimestamp || new Date(a.fullDate).getTime();
      const timeB = b.dateTimestamp || new Date(b.fullDate).getTime();
      return timeA - timeB;
    });

  // Helper function to normalize dates to midnight for accurate comparison
  const normalizeDate = (date: Date | string): Date => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // Get the last historical date to ensure forecast starts immediately after
  const lastHistoricalDate = chartData.length > 0 
    ? normalizeDate(chartData[chartData.length - 1].fullDate)
    : null;
  
  // Normalize today to midnight for comparison
  const todayNormalized = normalizeDate(today);
  const todayTimestamp = todayNormalized.getTime();
  
  // Helper function to process forecast data for a given forecast result
  const processForecastData = (forecast: ForecastResult | null): { forecastData: any[], fullForecastData: any[] } => {
    if (!forecast || !forecast.dates.length || !lastHistoricalDate) {
      return { forecastData: [], fullForecastData: [] };
    }
    
    const forecastData = forecast.dates
      .map((date: string, idx: number) => {
        const dateObj = normalizeDate(date);
        
        if (dateObj.getTime() <= lastHistoricalDate.getTime()) return null;
        if (dateObj.getTime() < todayNormalized.getTime()) return null;
        if (idx >= forecast.predicted.length || idx >= forecast.lowerBound.length || idx >= forecast.upperBound.length) return null;
        
        const predicted = forecast.predicted[idx];
        const lower = forecast.lowerBound[idx];
        const upper = forecast.upperBound[idx];
        
        if (isNaN(predicted) || isNaN(lower) || isNaN(upper)) return null;
        
        const maxZScore = 1.96;
        const priceStdDev = Math.abs(upper - lower) / 2;
        const clampedStdDev = Math.min(priceStdDev, predicted * 0.1);
        const clampedMargin = maxZScore * clampedStdDev;
        
        const minBound = Math.max(0, predicted - clampedMargin);
        const maxBound = predicted + clampedMargin;
        
        return {
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          fullDate: date,
          dateTimestamp: dateObj.getTime(),
          close: predicted,
          high: maxBound,
          low: minBound,
          isForecast: true,
          isHistorical: false,
          forecastLower: minBound,
          forecastUpper: maxBound,
          ema: null,
          upperBand: null,
          lowerBand: null,
          atr: null,
        };
      })
      .filter((point: any): point is NonNullable<typeof point> => point !== null)
      .sort((a: any, b: any) => a.dateTimestamp - b.dateTimestamp);
    
    const fullForecastData = chartData.length > 0 && forecastData.length > 0 
      ? [
          {
            ...chartData[chartData.length - 1],
            isConnector: true,
            forecastLower: chartData[chartData.length - 1].close,
            forecastUpper: chartData[chartData.length - 1].close,
          },
          ...forecastData
        ]
      : forecastData;
    
    return { forecastData, fullForecastData };
  };
  
  // Process forecast data for each model
  const simpleForecastData = processForecastData(simpleForecast);
  const arimaForecastData = processForecastData(arimaForecast);
  const prophetForecastData = processForecastData(prophetForecast);
  const lstmForecastData = processForecastData(lstmForecast);
  
  // Calculate Y-axis domain (shared across all charts for consistency)
  const calculateYDomain = () => {
    const allPrices: number[] = [];
    chartData.forEach(point => {
      if (point.close && !isNaN(point.close)) {
        allPrices.push(point.close);
      }
    });
    [simpleForecastData, arimaForecastData, prophetForecastData, lstmForecastData].forEach(({ forecastData }) => {
      forecastData.forEach((point: any) => {
        if (point.close && !isNaN(point.close)) {
          allPrices.push(point.close);
        }
      });
    });
    
    if (allPrices.length === 0) return [0, 100] as [number, number];
    
    const sorted = [...allPrices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
    const variance = allPrices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allPrices.length;
    const stdDev = Math.sqrt(variance);
    
    const min = Math.max(0, median - 2 * stdDev);
    const max = median + 2 * stdDev;
    const padding = (max - min) * 0.05;
    
    return [min - padding, max + padding] as [number, number];
  };
  
  const yDomain = calculateYDomain();
  
  // Legacy code for single chart when forecasting is disabled
  // Combine historical data for non-forecast view
  const allChartData = chartData
    .map((point: any) => {
      if (!point.dateTimestamp && point.fullDate) {
        point.dateTimestamp = new Date(point.fullDate).getTime();
      }
      return point;
    })
    .filter((point: any) => point.dateTimestamp && !isNaN(point.dateTimestamp))
    .sort((a: any, b: any) => {
      const timeA = a.dateTimestamp;
      const timeB = b.dateTimestamp;
      return timeA - timeB;
    });
  


  if (loading) {
    return (
      <div className="chart-preview">
        <div className="loading-state">Loading market data...</div>
      </div>
    );
  }

  // Show error as dismissible banner instead of blocking the entire interface
  const [errorDismissed, setErrorDismissed] = useState(false);
  
  // Reset dismissed state when error changes
  useEffect(() => {
    setErrorDismissed(false);
  }, [error]);
  
  if (error && !errorDismissed) {
    const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'SHIB', 'MATIC', 'LTC', 'UNI', 'LINK', 'ATOM', 'ETC', 'XLM', 'BCH', 'ALGO', 'VET', 'ICP', 'FIL', 'TRX', 'EOS', 'AAVE', 'THETA', 'XMR', 'MKR', 'DASH', 'ZEC'].includes(config.symbol.toUpperCase());
    const suggestion = isCrypto && config.apiProvider === 'eodhd' 
      ? ' Try switching to Alpha Vantage provider for cryptocurrency data.'
      : '';
    
    const handleSwitchProvider = () => {
      const newConfig = { ...config, apiProvider: 'alphavantage' as const };
      setConfig(newConfig);
      persistConfig(newConfig);
      setErrorDismissed(true);
      loadData(false);
    };
    
    return (
      <div className="chart-preview">
        <div className="error-banner">
          <div className="error-content">
            <h3 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--accent-red)' }}>Error</h3>
            <p style={{ margin: 0, marginBottom: '0.75rem' }}>{error}{suggestion}</p>
            {isCrypto && config.apiProvider === 'eodhd' && (
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  💡 Tip: EODHD may require premium subscription for crypto. Switch to Alpha Vantage for free crypto data.
                </p>
                <button
                  onClick={handleSwitchProvider}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--accent-blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginRight: '0.5rem'
                  }}
                >
                  Switch to Alpha Vantage
                </button>
                <button
                  onClick={() => setErrorDismissed(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}
            {(!isCrypto || config.apiProvider !== 'eodhd') && (
              <button
                onClick={() => setErrorDismissed(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {marketData.length === 0 && (
          <div className="empty-state">
            <h3>No Data</h3>
            <p>Enter a symbol and API key to load market data</p>
          </div>
        )}
      </div>
    );
  }

  if (marketData.length === 0) {
    return (
      <div className="chart-preview">
        <div className="empty-state">
          <h3>No Data</h3>
          <p>Enter a symbol and API key to load market data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-preview">
      {/* Show all 4 model charts in a grid when forecasting is enabled */}
      {forecastEnabled ? (
        <div className="models-grid">
          <SingleModelChart
            modelName="simple"
            modelLabel="Simple MA"
            forecast={simpleForecast}
            chartData={chartData}
            forecastData={simpleForecastData.forecastData}
            fullForecastData={simpleForecastData.fullForecastData}
            config={config}
            indicators={indicators}
            signals={signals}
            marketData={marketData}
            todayTimestamp={todayTimestamp}
            yDomain={yDomain}
          />
          <SingleModelChart
            modelName="arima"
            modelLabel="ARIMA"
            forecast={arimaForecast}
            chartData={chartData}
            forecastData={arimaForecastData.forecastData}
            fullForecastData={arimaForecastData.fullForecastData}
            config={config}
            indicators={indicators}
            signals={signals}
            marketData={marketData}
            todayTimestamp={todayTimestamp}
            yDomain={yDomain}
          />
          <SingleModelChart
            modelName="prophet"
            modelLabel="Prophet"
            forecast={prophetForecast}
            chartData={chartData}
            forecastData={prophetForecastData.forecastData}
            fullForecastData={prophetForecastData.fullForecastData}
            config={config}
            indicators={indicators}
            signals={signals}
            marketData={marketData}
            todayTimestamp={todayTimestamp}
            yDomain={yDomain}
          />
          <SingleModelChart
            modelName="lstm"
            modelLabel="LSTM"
            forecast={lstmForecast}
            chartData={chartData}
            forecastData={lstmForecastData.forecastData}
            fullForecastData={lstmForecastData.fullForecastData}
            config={config}
            indicators={indicators}
            signals={signals}
            marketData={marketData}
            todayTimestamp={todayTimestamp}
            yDomain={yDomain}
          />
        </div>
      ) : (
        <div className="chart-container" style={{ width: '100%', height: '500px', minHeight: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={allChartData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
            >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
            <XAxis
              dataKey="dateTimestamp"
              type="number"
              scale="time"
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={80}
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => {
                if (!value || isNaN(value)) return '';
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }}
            />
            <YAxis
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8' }}
              domain={yDomain}
              allowDataOverflow={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '6px',
                color: '#F1F5F9',
                padding: '0.5rem',
              }}
              labelFormatter={(value) => {
                if (!value || isNaN(value)) return '';
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }}
              formatter={(value: any, name: string) => {
                if (typeof value === 'number') {
                  return [`$${value.toFixed(2)}`, name];
                }
                return [value, name];
              }}
            />
            <Legend 
              wrapperStyle={{ color: '#CBD5E1', paddingTop: '1rem' }}
              iconType="line"
            />
            
            {/* Layer 1: Historical price line - base layer */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#F1F5F9"
              strokeWidth={2}
              name="Close Price"
              dot={false}
              connectNulls={false}
              data={chartData}
              isAnimationActive={false}
            />
            {/* Layer 2: EMA and Volatility Bands */}
            {config.ema.enabled && (
              <Line
                type="monotone"
                dataKey="ema"
                stroke="#14B8A6"
                strokeWidth={1.5}
                name={`EMA(${config.ema.period})`}
                dot={false}
                isAnimationActive={false}
              />
            )}
            
            {config.volatilityBands.enabled && (
              <>
                <Line
                  type="monotone"
                  dataKey="upperBand"
                  stroke="#10B981"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                  name="Upper Band"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  stroke="#10B981"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                  name="Lower Band"
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}
            
            {/* Layer 3: Forecast with confidence intervals - not shown in single chart view when forecasting disabled */}
            
            {/* Layer 4: "Today" marker to delineate forecast boundary */}
            {chartData.length > 0 && (
              <ReferenceLine
                x={todayTimestamp}
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="8 4"
                strokeOpacity={0.6}
                label={{
                  value: 'Today',
                  position: 'top',
                  fill: '#94A3B8',
                  fontSize: 11,
                  fontWeight: 'bold',
                  offset: 10,
                }}
              />
            )}
            
            {/* Layer 5: Signal markers - top layer for visibility */}
            {signals.map((signal, idx) => {
              const signalDataPoint = chartData.find(p => {
                const marketIdx = marketData.findIndex(m => m.date === p.fullDate);
                return marketIdx === signal.index;
              });
              if (!signalDataPoint || !signalDataPoint.dateTimestamp) return null;
              return (
                <ReferenceLine
                  key={`signal-${idx}`}
                  x={signalDataPoint.dateTimestamp}
                  stroke={signal.type === 'BUY' ? '#10B981' : '#EF4444'}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeOpacity={0.8}
                  label={{
                    value: signal.type === 'BUY' ? '▲ BUY' : '▼ SELL',
                    position: signal.type === 'BUY' ? 'bottom' : 'top',
                    fill: signal.type === 'BUY' ? '#10B981' : '#EF4444',
                    fontSize: 12,
                    fontWeight: 'bold',
                    offset: signal.type === 'BUY' ? 15 : -15,
                  }}
                />
              );
            })}
            
            {/* Signal markers on price line - BUY: green ▲, SELL: red ▼ */}
            {chartData.filter(p => p.signal).map((point, idx) => {
              if (!point.signal || point.isForecast) return null;
              
              const isBuy = point.signal === 'BUY';
              const color = isBuy ? '#10B981' : '#EF4444';
              
              // Find the corresponding data point index for rendering
              const pointIndex = allChartData.findIndex(p => p.dateTimestamp === point.dateTimestamp);
              if (pointIndex === -1) return null;
              
              return (
                <ReferenceLine
                  key={`signal-marker-${point.fullDate}-${point.signal}-${idx}`}
                  x={point.dateTimestamp}
                  stroke={color}
                  strokeWidth={0}
                  label={{
                    value: isBuy ? '▲' : '▼',
                    position: isBuy ? 'bottom' : 'top',
                    fill: color,
                    fontSize: 14,
                    fontWeight: 'bold',
                    offset: isBuy ? 5 : -5,
                  }}
                />
              );
            })}
            
            {/* Stop loss and target lines for latest signal */}
            {signals.length > 0 && (() => {
              const latestSignal = signals[signals.length - 1];
              if (!latestSignal || isNaN(latestSignal.stopLoss) || isNaN(latestSignal.target)) return null;
              return (
                <>
                  <ReferenceLine
                    y={latestSignal.stopLoss}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    label={{ value: 'Stop Loss', position: 'right', fill: '#EF4444' }}
                  />
                  <ReferenceLine
                    y={latestSignal.target}
                    stroke="#10B981"
                    strokeDasharray="3 3"
                    label={{ value: 'Target', position: 'right', fill: '#10B981' }}
                  />
                </>
              );
            })()}
            
            {/* Support/Resistance levels */}
            {supportResistance.slice(0, 3).map((level, idx) => {
              if (!level || isNaN(level.level)) return null;
              return (
                <ReferenceLine
                  key={`sr-${level.type}-${level.level.toFixed(2)}-${idx}`}
                  y={level.level}
                  stroke={level.type === 'support' ? '#10B981' : '#EF4444'}
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  strokeOpacity={0.5}
                  label={{
                    value: `${level.type === 'support' ? 'S' : 'R'}: $${level.level.toFixed(2)}`,
                    position: 'right',
                    fill: level.type === 'support' ? '#10B981' : '#EF4444',
                    fontSize: 10,
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      )}

      <div className="preview-tabs">
        <div className="tab-content">
          <div className="preview-bottom">
            {indicators && (() => {
              const metrics = [];
              
              if (config.ema.enabled) {
                metrics.push({
                  id: 'ema',
                  label: 'EMA',
                  value: indicators.ema[indicators.ema.length - 1]?.toFixed(2) || 'N/A',
                  description: 'EMA shows trend direction. Price above EMA = bullish trend (buy opportunities). Price below EMA = bearish trend (sell/avoid). Helps you trade with the trend, increasing win rate and reducing losses from counter-trend trades.',
                });
              }
              
              if (config.atr.enabled) {
                metrics.push({
                  id: 'atr',
                  label: 'ATR',
                  value: indicators.atr[indicators.atr.length - 1]?.toFixed(2) || 'N/A',
                  description: 'ATR measures volatility. Higher ATR = wider stop-losses needed = smaller position sizes to maintain risk. Lower ATR = tighter stops = larger positions possible. Proper ATR usage prevents getting stopped out by normal price swings, protecting your capital.',
                });
              }
              
              if (config.volatilityBands.enabled) {
                metrics.push({
                  id: 'bands',
                  label: 'Bands',
                  value: `U: $${indicators.upperBand?.[indicators.upperBand.length - 1]?.toFixed(2) || 'N/A'} | L: $${indicators.lowerBand?.[indicators.lowerBand.length - 1]?.toFixed(2) || 'N/A'}`,
                  description: 'Bands identify overbought (upper) and oversold (lower) conditions. Buying near lower band and selling near upper band improves entry/exit timing, increasing profit per trade. Price outside bands often reverses, creating mean reversion opportunities.',
                });
              }
              
              metrics.push({
                id: 'risk',
                label: 'Risk',
                value: `$${((config.riskManagement.accountSize * config.riskManagement.riskPercentage) / 100).toFixed(2)}`,
                description: 'This is the maximum you risk per trade. With proper risk management (1-2% per trade), you can survive 50+ losing trades in a row. This protects your account from ruin and ensures long-term profitability. Never risk more than this amount on a single trade.',
              });
              
              if (riskMetrics) {
                metrics.push({
                  id: 'position',
                  label: 'Position',
                  value: `${riskMetrics.positionSize.toFixed(2)} shares`,
                  description: 'Calculated based on your risk amount and stop-loss distance. This ensures you never lose more than your risk percentage, regardless of how far price moves against you. Proper position sizing is critical for consistent profitability.',
                });
                
                if (riskMetrics.riskRewardRatio > 0) {
                  metrics.push({
                    id: 'rr',
                    label: 'R:R',
                    value: `${riskMetrics.riskRewardRatio.toFixed(2)}:1`,
                    description: 'Shows potential profit vs. risk. A 3:1 ratio means you make $3 for every $1 risked. With a 50% win rate, 3:1 R:R means you\'re profitable. Higher R:R = fewer wins needed to be profitable. Always aim for minimum 2:1, preferably 3:1 or higher.',
                  });
                }
              }
              
              return metrics.length > 0 ? <MetricsTabs metrics={metrics} /> : null;
            })()}
            
            {/* Trading Signals - Moved to Center */}
            <div className="signals-center">
              <SignalsPanel
                signals={signals}
                riskMetrics={riskMetrics}
                supportResistance={supportResistance}
              />
            </div>
            
            {/* Forecast Panel - Right Side - Show first available forecast */}
            {forecastEnabled && (simpleForecast || arimaForecast || prophetForecast || lstmForecast) && (
              <div className="forecast-right">
                <ForecastPanel
                  forecast={simpleForecast || arimaForecast || prophetForecast || lstmForecast}
                  currentPrice={marketData.length > 0 ? marketData[marketData.length - 1].close : 0}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

