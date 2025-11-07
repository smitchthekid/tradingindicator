import React, { useEffect, useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { configAtom } from '../atoms/config';
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
  activeForecastAtom,
  forecastLoadingAtom,
  forecastErrorAtom,
  forecastCache,
} from '../atoms/forecast';
import { fetchMarketData } from '../services/api';
import { calculateIndicators } from '../utils/calculations';
import { getCachedData, getCacheAge, clearCache } from '../utils/cache';
import { generateSignals, detectSupportResistance, calculateRiskMetrics } from '../utils/signals';
import { TradingSignal, SupportResistance, RiskMetrics } from '../types';
import { generateForecast, simpleMAForecast, arimaForecast, prophetForecast, lstmForecast } from '../utils/forecasting';
import { ForecastResult } from '../types/forecast';
import { SignalsPanel } from './SignalsPanel';
import { ForecastPanel } from './ForecastPanel';
import { MetricsTabs } from './MetricsTabs';
import './ChartPreview.css';

export const ChartPreview: React.FC = () => {
  const [config] = useAtom(configAtom);
  const [marketData, setMarketData] = useAtom(marketDataAtom);
  const [indicators, setIndicators] = useAtom(indicatorsAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [isCached, setIsCached] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [lastSymbol, setLastSymbol] = useState<string>('');
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [supportResistance, setSupportResistance] = useState<SupportResistance[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  
  // Forecast atoms
  const [forecastModel, setForecastModel] = useAtom(forecastModelAtom);
  const [forecastEnabled, setForecastEnabled] = useAtom(forecastEnabledAtom);
  const [forecastPeriod, setForecastPeriod] = useAtom(forecastPeriodAtom);
  const [forecastConfidence, setForecastConfidence] = useAtom(forecastConfidenceAtom);
  const [simpleForecast, setSimpleForecast] = useAtom(simpleForecastAtom);
  const [arimaForecast, setArimaForecast] = useAtom(arimaForecastAtom);
  const [prophetForecast, setProphetForecast] = useAtom(prophetForecastAtom);
  const [lstmForecast, setLstmForecast] = useAtom(lstmForecastAtom);
  const [forecastLoading, setForecastLoading] = useAtom(forecastLoadingAtom);
  const [forecastError, setForecastError] = useAtom(forecastErrorAtom);
  const [activeForecast] = useAtom(activeForecastAtom);

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
        setIsCached(false);
        setCacheAge(null);
      } else {
        if (response.data.length === 0) {
          setError('No data returned. Check symbol format and API key.');
          setMarketData([]);
          setIndicators(null);
          setIsCached(false);
          setCacheAge(null);
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
          
          // Update cache status based on API response
          setIsCached(response.fromCache === true);
          setCacheAge(getCacheAge(config.symbol, config.apiProvider));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setMarketData([]);
      setIndicators(null);
      setIsCached(false);
      setCacheAge(null);
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
        setIsCached(true);
        setCacheAge(getCacheAge(config.symbol, config.apiProvider));
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
        setIsCached(true);
        setCacheAge(getCacheAge(config.symbol, config.apiProvider));
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

      // Compute Simple MA forecast (with cache check)
      const cachedSimple = forecastCache.get('simple', symbol, marketData, period, confidence);
      if (cachedSimple) {
        setSimpleForecast(cachedSimple);
      } else {
        const simpleResult = simpleMAForecast(marketData, 20, period, confidence);
        if (simpleResult) {
          forecastCache.set('simple', symbol, marketData, period, confidence, simpleResult);
          setSimpleForecast(simpleResult);
        }
      }

      // Compute ARIMA forecast (with cache check)
      const cachedArima = forecastCache.get('arima', symbol, marketData, period, confidence);
      if (cachedArima) {
        setArimaForecast(cachedArima);
      } else {
        const arimaResult = arimaForecast(marketData, period, confidence);
        if (arimaResult) {
          forecastCache.set('arima', symbol, marketData, period, confidence, arimaResult);
          setArimaForecast(arimaResult);
        }
      }

      // Compute Prophet forecast (with cache check)
      const cachedProphet = forecastCache.get('prophet', symbol, marketData, period, confidence);
      if (cachedProphet) {
        setProphetForecast(cachedProphet);
      } else {
        const prophetResult = prophetForecast(marketData, period, confidence);
        if (prophetResult) {
          forecastCache.set('prophet', symbol, marketData, period, confidence, prophetResult);
          setProphetForecast(prophetResult);
        }
      }

      // Compute LSTM forecast (with cache check)
      const cachedLstm = forecastCache.get('lstm', symbol, marketData, period, confidence);
      if (cachedLstm) {
        setLstmForecast(cachedLstm);
      } else {
        const lstmResult = lstmForecast(marketData, period, confidence);
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

  // Get the last historical date to ensure forecast starts immediately after
  const lastHistoricalDate = chartData.length > 0 
    ? new Date(chartData[chartData.length - 1].fullDate)
    : null;
  
  // Add forecast data points separately (using activeForecast from atoms)
  // Forecast should only start AFTER the last historical point
  const forecastData = activeForecast && activeForecast.dates.length > 0 && lastHistoricalDate
    ? activeForecast.dates
        .map((date, idx) => {
          const dateObj = new Date(date);
          
          // Validate forecast date is after last historical date
          if (dateObj <= lastHistoricalDate) {
            console.warn(`Forecast date ${date} is not after last historical date ${lastHistoricalDate.toISOString().split('T')[0]}`);
            return null;
          }
          
          // Ensure forecast date is in the future (not historical)
          if (dateObj <= today) {
            console.warn(`Forecast date ${date} is not in the future`);
            return null;
          }
          
          const predicted = activeForecast.predicted[idx];
          const lower = activeForecast.lowerBound[idx];
          const upper = activeForecast.upperBound[idx];
          
          // Ensure bounds are different and visible
          const minBound = Math.min(lower, predicted * 0.98);
          const maxBound = Math.max(upper, predicted * 1.02);
          
          return {
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            fullDate: date,
            dateTimestamp: dateObj.getTime(), // For sorting
            close: predicted,
            high: maxBound,
            low: minBound,
            isForecast: true,
            isHistorical: false, // Mark as forecast data
            forecastLower: minBound,
            forecastUpper: maxBound,
            // Set historical indicators to null for forecast points
            ema: null,
            upperBand: null,
            lowerBand: null,
            atr: null,
          };
        })
        .filter((point): point is NonNullable<typeof point> => point !== null)
        .sort((a, b) => a.dateTimestamp - b.dateTimestamp) // Sort forecast data
    : [];

  // Combine historical and forecast data
  // Historical data comes first, then forecast immediately after
  const allChartData = [...chartData, ...forecastData]
    .map(point => {
      // Ensure every point has a valid timestamp
      if (!point.dateTimestamp && point.fullDate) {
        point.dateTimestamp = new Date(point.fullDate).getTime();
      }
      return point;
    })
    .filter(point => point.dateTimestamp && !isNaN(point.dateTimestamp))
    .sort((a, b) => {
      const timeA = a.dateTimestamp;
      const timeB = b.dateTimestamp;
      return timeA - timeB;
    });
  
  // Log for debugging
  if (allChartData.length > 0) {
    const firstDate = new Date(allChartData[0].dateTimestamp);
    const lastDate = new Date(allChartData[allChartData.length - 1].dateTimestamp);
    const historicalCount = chartData.length;
    const forecastCount = forecastData.length;
    const daysDiff = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Chart data: ${historicalCount} historical + ${forecastCount} forecast = ${allChartData.length} total points`);
    console.log(`Date range: ${firstDate.toISOString().split('T')[0]} to ${lastDate.toISOString().split('T')[0]} (${daysDiff} days)`);
    
    if (historicalCount < 90) {
      console.warn(`⚠️ Insufficient historical data: ${historicalCount} days. Aim for 6-12 months (180-365 days) for best results.`);
    }
  }
  
  // Separate data for forecast rendering (includes connector point)
  const fullForecastData = chartData.length > 0 && forecastData.length > 0 
    ? [
        // Connector point: last historical point (for smooth line connection)
        {
          ...chartData[chartData.length - 1],
          isConnector: true,
        },
        ...forecastData
      ]
    : forecastData;


  if (loading) {
    return (
      <div className="chart-preview">
        <div className="loading-state">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'DOGE'].includes(config.symbol.toUpperCase());
    const suggestion = isCrypto && config.apiProvider === 'eodhd' 
      ? ' Try switching to Alpha Vantage provider for cryptocurrency data.'
      : '';
    
    return (
      <div className="chart-preview">
        <div className="error-state">
          <h3>Error</h3>
          <p>{error}{suggestion}</p>
          {isCrypto && config.apiProvider === 'eodhd' && (
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              💡 Tip: EODHD may require premium subscription for crypto. Switch to Alpha Vantage for free crypto data.
            </p>
          )}
        </div>
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
      <div className="chart-header">
        <div className="header-left">
          <h2>{config.symbol} - Price Chart</h2>
          {isCached && cacheAge !== null && (
            <div className="cache-badge">
              <span className="cache-icon">💾</span>
              <span>Cached ({cacheAge}m ago)</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <button
            onClick={() => {
              clearCache();
              loadData(true);
            }}
            disabled={loading || !config.symbol || !config.apiKey}
            className="refresh-button"
            title="Clear cache and refresh data from API"
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
          {indicators && indicators.positionSize > 0 && (
            <div className="position-info">
              <span>Position: {indicators.positionSize} shares</span>
            </div>
          )}
        </div>
      </div>

      <div className="chart-container" style={{ width: '100%', height: '500px', minHeight: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={allChartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
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
              domain={['auto', 'auto']}
              allowDataOverflow={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '6px',
                color: '#F1F5F9',
              }}
            />
            <Legend wrapperStyle={{ color: '#CBD5E1' }} />
            
              {/* Historical price line - only for historical data */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#F1F5F9"
                strokeWidth={2}
                name="Close Price"
                dot={false}
                connectNulls={false}
                data={chartData} // Only use historical data for price line
              />
            {/* Signal markers on historical price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="transparent"
              strokeWidth={0}
              name=""
              data={chartData} // Only show signals on historical data
              dot={(props: any) => {
                const { payload, cx, cy } = props;
                // Only show signals on historical data
                if (!payload || payload.isForecast || !payload.signal) return null;
                
                const isBuy = payload.signal === 'BUY';
                const color = isBuy ? '#10B981' : '#EF4444';
                const size = 12;
                
                return (
                  <g key={`signal-marker-${payload.fullDate}-${payload.signal}`}>
                    <polygon
                      points={isBuy 
                        ? `${cx},${cy - size} ${cx - size/2},${cy + size/2} ${cx + size/2},${cy + size/2}`
                        : `${cx},${cy + size} ${cx - size/2},${cy - size/2} ${cx + size/2},${cy - size/2}`
                      }
                      fill={color}
                      stroke={color}
                      strokeWidth={2}
                    />
                    <text
                      x={cx}
                      y={isBuy ? cy - size - 8 : cy + size + 20}
                      fill={color}
                      fontSize={11}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {payload.signal}
                    </text>
                  </g>
                );
              }}
            />
            
            {/* Forecast line with confidence intervals */}
            {activeForecast && fullForecastData.length > 0 && (
              <>
                {/* Confidence interval area */}
                <defs>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="forecastUpper"
                  base="forecastLower"
                  stroke="none"
                  fill="url(#forecastGradient)"
                  data={fullForecastData}
                  connectNulls={true}
                  name={`${(activeForecast.confidence * 100).toFixed(0)}% Confidence`}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  name={`Forecast (${activeForecast.model})`}
                  dot={false}
                  data={fullForecastData}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecastUpper"
                  stroke="#F59E0B"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  dot={false}
                  data={fullForecastData}
                  connectNulls={true}
                />
                <Line
                  type="monotone"
                  dataKey="forecastLower"
                  stroke="#F59E0B"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  dot={false}
                  data={fullForecastData}
                  connectNulls={true}
                />
              </>
            )}
            
            {config.ema.enabled && (
              <Line
                type="monotone"
                dataKey="ema"
                stroke={config.ema.color}
                strokeWidth={1.5}
                name={`EMA(${config.ema.period})`}
                dot={false}
              />
            )}
            
            {config.volatilityBands.enabled && (
              <>
                <Line
                  type="monotone"
                  dataKey="upperBand"
                  stroke={config.volatilityBands.color}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Upper Band"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  stroke={config.volatilityBands.color}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Lower Band"
                  dot={false}
                />
              </>
            )}
            
            {/* Signal vertical reference lines with labels */}
            {signals.map((signal, idx) => {
              const signalDataPoint = chartData.find(p => {
                // Find by matching the original market data index
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
            
            {/* Forecast Panel - Right Side */}
            {forecastEnabled && activeForecast && (
              <div className="forecast-right">
                <ForecastPanel
                  forecast={activeForecast}
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

