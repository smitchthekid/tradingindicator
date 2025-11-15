import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
// Centralized atom imports
import { configAtom } from '../atoms/config';
import { marketDataAtom, loadingAtom, errorAtom, refreshTriggerAtom } from '../atoms/data';

// Services and utilities
import { fetchMarketData } from '../services/api';
import { getCachedData } from '../utils/cache';
import { logger } from '../utils/logger';

// Chart data utilities
import { normalizeDate } from '../utils/chartData';

// Custom hooks
import { useAlerts } from '../hooks/useAlerts';
import { useForecasts } from '../hooks/useForecasts';
import { useIndicators } from '../hooks/useIndicators';

// Components
import { SignalsPanel } from './SignalsPanel';
import { ForecastPanel } from './ForecastPanel';
import { MetricsTabs } from './MetricsTabs';
import { AlertPanel } from './AlertPanel';

// Chart components
import { HistoricalChart, ForecastChart } from './chart';

// Theme
import { chartTheme } from '../styles/chartTheme';

// Types
import { ForecastResult } from '../types/forecast';
import './ChartPreview.css';

export const ChartPreview: React.FC = () => {
  // Centralized atom access
  const [config] = useAtom(configAtom);
  const [marketData, setMarketData] = useAtom(marketDataAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [refreshTrigger] = useAtom(refreshTriggerAtom);
  
  // Local state
  const [lastSymbol, setLastSymbol] = useState<string>('');
  const [errorDismissed, setErrorDismissed] = useState(false);
  
  // Custom hooks - centralized logic
  useAlerts(); // Initialize alert system
  const { indicators, signals, supportResistance, riskMetrics } = useIndicators(marketData, config);
  const {
    forecastEnabled,
    simpleForecast,
    arimaForecast,
    prophetForecast,
    lstmForecast,
    activeForecast,
  } = useForecasts(marketData, config);

  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    if (!config.symbol) {
      setError('Please enter a symbol');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchMarketData(
        config.symbol,
        '', // API key not required for Yahoo Finance
        'yahoo',
        forceRefresh
      );

      if (response.error) {
        setError(response.error);
        setMarketData([]);
      } else {
        if (response.data.length === 0) {
          setError('No data returned. Check symbol format and API key.');
          setMarketData([]);
        } else {
          // Log received data for debugging
          logger.log(`ChartPreview: Received ${response.data.length} data points`);
          if (response.data.length > 0) {
            logger.log(`Date range: ${response.data[0].date} to ${response.data[response.data.length - 1].date}`);
          }
          
          // Check if we only have 1 day of data - likely an issue
          if (response.data.length <= 1) {
            logger.warn('Warning: Only received 1 day of data. This may indicate an API limitation or error.');
            setError('Only received today\'s data. The API may be rate-limited or the symbol may not be supported. Try refreshing or switching providers.');
          }
          
          setMarketData(response.data);
          // Indicators will be recalculated automatically by useIndicators hook
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  }, [config.symbol, setLoading, setError, setMarketData]);

  // Initial load on mount
  useEffect(() => {
    if (config.symbol && marketData.length === 0) {
      // Check for cached data first
      const cached = getCachedData(config.symbol, 'yahoo');
      if (cached && cached.length > 0) {
        setMarketData(cached);
        // Indicators will be recalculated automatically by useIndicators hook
      } else {
        // Auto-fetch if no cache exists
        loadData(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load cached data on symbol/provider change (debounced)
  useEffect(() => {
    if (config.symbol !== lastSymbol && config.symbol) {
      setLastSymbol(config.symbol);
      
      // Check for cached data first
      const cached = getCachedData(config.symbol, 'yahoo');
      if (cached && cached.length > 0) {
        setMarketData(cached);
        // Indicators will be recalculated automatically by useIndicators hook
      } else {
        // Only auto-fetch if no cache exists
        const timer = setTimeout(() => {
          loadData(false);
        }, 500); // Debounce 500ms
        
        return () => clearTimeout(timer);
      }
    }
  }, [config.symbol, lastSymbol, setMarketData, loadData]);

  // Handle manual refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0 && config.symbol) {
      loadData(true); // Force refresh bypasses cache
    }
  }, [refreshTrigger, config.symbol, loadData]);

  // Forecasts and indicators are now handled by custom hooks (useForecasts and useIndicators)
  // No need for manual useEffect hooks here

  // Historical data mapping - only includes actual historical prices and indicators
  // Validate dates are not in the future
  // Memoize chart data processing to avoid recalculation on every render
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);
  
  const chartData = useMemo(() => marketData
    .map((data, index) => {
      if (!data || isNaN(data.close)) return null;
      
      // Validate date is not in the future
      // Parse date string (format: YYYY-MM-DD) as UTC midnight to avoid timezone issues
      const dateStr = data.date;
      let dateObj: Date;
      
      // Handle different date formats
      if (dateStr.includes('T')) {
        // ISO format with time
        dateObj = new Date(dateStr);
      } else {
        // YYYY-MM-DD format - parse as UTC to avoid timezone issues
        // Then convert to local date at midnight for comparison
        const [year, month, day] = dateStr.split('-').map(Number);
        dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      
      if (isNaN(dateObj.getTime())) {
        // Only log in development to avoid performance hit
        if (import.meta.env.DEV) {
          logger.warn(`Invalid date in market data: ${data.date}`);
        }
        return null;
      }
      
      // Skip future dates (historical data only)
      // Compare dates at midnight UTC to avoid timezone issues
      // Parse the date string as UTC to match how Yahoo Finance provides dates
      const dateUTC = new Date(dateStr + 'T00:00:00Z');
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      
      // Only skip if date is clearly in the future (more than 1 day ahead)
      // Allow today's date and dates up to 1 day ahead (to handle timezone differences)
      const daysDifference = Math.floor((dateUTC.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference > 1) {
        // Only log in development to avoid performance hit
        if (import.meta.env.DEV) {
          logger.warn(`Skipping future date in historical data: ${data.date} (${daysDifference} days ahead)`);
        }
        return null;
      }
      
      // Use the UTC date for timestamp, but keep local date for display
      const point: any = {
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fullDate: data.date,
        dateTimestamp: dateUTC.getTime(), // Use UTC timestamp for consistent sorting
        close: data.close,
        high: data.high || data.close,
        low: data.low || data.close,
        open: data.open || data.close,
        volume: data.volume || 0,
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

      // Add indicators - only include if enabled
      if (indicators) {
        if (config.ema.enabled && indicators.ema && indicators.ema[index] !== undefined && !isNaN(indicators.ema[index])) {
          point.ema = indicators.ema[index];
        } else {
          // Explicitly set to undefined when disabled to ensure chart updates
          point.ema = undefined;
        }
        if (config.volatilityBands.enabled) {
          if (indicators.upperBand && indicators.upperBand[index] !== undefined && !isNaN(indicators.upperBand[index])) {
            point.upperBand = indicators.upperBand[index];
          } else {
            point.upperBand = undefined;
          }
          if (indicators.lowerBand && indicators.lowerBand[index] !== undefined && !isNaN(indicators.lowerBand[index])) {
            point.lowerBand = indicators.lowerBand[index];
          } else {
            point.lowerBand = undefined;
          }
        } else {
          // Explicitly clear bands when disabled
          point.upperBand = undefined;
          point.lowerBand = undefined;
        }
        if (config.atr.enabled && indicators.atr && indicators.atr[index] !== undefined && !isNaN(indicators.atr[index])) {
          point.atr = indicators.atr[index];
          // Calculate ATR-based stop loss distance for visualization
          if (indicators.atr[index] > 0) {
            point.atrStopLossDistance = indicators.atr[index] * config.riskManagement.atrStopLossMultiplier;
            point.atrStopLossLong = point.close - point.atrStopLossDistance;
            point.atrStopLossShort = point.close + point.atrStopLossDistance;
          }
        } else {
          point.atr = undefined;
        }
        if (indicators.stopLoss && indicators.stopLoss[index] !== undefined && !isNaN(indicators.stopLoss[index])) {
          if (!point.signalStopLoss) {
            point.stopLoss = indicators.stopLoss[index];
          }
        }
      }
      
      // Determine if volume bar should be green (up day) or red (down day)
      if (point.open && point.close) {
        point.isUpDay = point.close >= point.open;
      }

      return point;
    })
    .filter(Boolean) // Remove any null entries
    .sort((a, b) => {
      // Sort by timestamp to ensure chronological order
      const timeA = a.dateTimestamp || new Date(a.fullDate).getTime();
      const timeB = b.dateTimestamp || new Date(b.fullDate).getTime();
      return timeA - timeB;
    }), [marketData, signals, indicators, config.ema.enabled, config.ema.period, config.volatilityBands.enabled, config.atr.enabled, config.riskManagement.atrStopLossMultiplier, today]);

  // Get the last historical date to ensure forecast starts immediately after
  // Using normalizeDate from chartData utilities
  const lastHistoricalDate = chartData.length > 0 
    ? normalizeDate(chartData[chartData.length - 1].fullDate)
    : null;
  
  // Normalize today to midnight for comparison
  const todayNormalized = normalizeDate(today);
  const todayTimestamp = todayNormalized.getTime();
  
  // Helper function to process forecast data for a given forecast result
  const processForecastData = useCallback((forecast: ForecastResult | null): { forecastData: any[], fullForecastData: any[] } => {
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
  }, [lastHistoricalDate, todayNormalized, chartData]);
  
  // Process forecast data for each model
  const simpleForecastData = processForecastData(simpleForecast);
  const arimaForecastData = processForecastData(arimaForecast);
  const prophetForecastData = processForecastData(prophetForecast);
  const lstmForecastData = processForecastData(lstmForecast);
  
  // Calculate ATR thresholds for background shading
  const atrThresholds = useMemo(() => {
    if (!config.atr.enabled || !indicators?.atr || indicators.atr.length === 0) {
      return { high: null, medium: null };
    }
    
    const validATRs = indicators.atr.filter((atr: number) => !isNaN(atr) && atr > 0);
    if (validATRs.length === 0) return { high: null, medium: null };
    
    const sorted = [...validATRs].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q75 = sorted[Math.floor(sorted.length * 0.75)];
    
    return {
      high: q75, // 75th percentile - high volatility
      medium: median, // 50th percentile - medium volatility
    };
  }, [config.atr.enabled, indicators?.atr]);
  
  // Calculate volume domain for secondary axis
  const volumeDomain = useMemo(() => {
    const volumes = chartData
      .map((point: any) => point.volume)
      .filter((vol: number) => !isNaN(vol) && vol > 0);
    
    if (volumes.length === 0) return [0, 100] as [number, number];
    
    const maxVolume = Math.max(...volumes);
    return [0, maxVolume] as [number, number];
  }, [chartData]);
  
  // Calculate ATR domain for secondary Y-axis
  const atrDomain = useMemo(() => {
    if (!config.atr.enabled || !indicators?.atr) {
      return [0, 100] as [number, number];
    }
    
    const validATRs = indicators.atr.filter((atr: number) => !isNaN(atr) && atr > 0);
    if (validATRs.length === 0) return [0, 100] as [number, number];
    
    const maxATR = Math.max(...validATRs);
    const minATR = Math.min(...validATRs);
    const padding = (maxATR - minATR) * 0.1;
    
    return [Math.max(0, minATR - padding), maxATR + padding] as [number, number];
  }, [config.atr.enabled, indicators?.atr]);
  
  // Combine historical data for chart rendering
  // Memoize to avoid recalculation on every render
  const allChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      if (import.meta.env.DEV) {
        console.log('[ChartPreview] allChartData: chartData is empty');
      }
      return [];
    }
    
    const processed = chartData
      .map((point: any) => {
        if (!point) return null;
        // Ensure dateTimestamp exists
        if (!point.dateTimestamp && point.fullDate) {
          const dateObj = new Date(point.fullDate);
          if (isNaN(dateObj.getTime())) return null;
          point.dateTimestamp = dateObj.getTime();
        }
        // Ensure close price exists and is valid
        if (!point.close || isNaN(point.close) || point.close <= 0) {
          return null;
        }
        return point;
      })
      .filter((point: any): point is NonNullable<typeof point> => {
        return point !== null && 
               point.dateTimestamp && 
               !isNaN(point.dateTimestamp) &&
               point.close &&
               !isNaN(point.close) &&
               point.close > 0;
      })
      .sort((a: any, b: any) => {
        const timeA = a.dateTimestamp;
        const timeB = b.dateTimestamp;
        return timeA - timeB;
      });
    
    if (import.meta.env.DEV && processed.length > 0) {
      console.log(`[ChartPreview] allChartData: ${processed.length} points, first: ${processed[0].date}, last: ${processed[processed.length - 1].date}, price range: $${Math.min(...processed.map((p: any) => p.close))} - $${Math.max(...processed.map((p: any) => p.close))}`);
    }
    
    return processed;
  }, [chartData]);

  // Calculate Y-axis domain (shared across all charts for consistency)
  // Use allChartData which is the actual data being rendered
  const yDomain = useMemo(() => {
    const allPrices: number[] = [];
    
    // Use allChartData which is the actual data being rendered
    allChartData.forEach((point: any) => {
      if (point && point.close && !isNaN(point.close) && point.close > 0) {
        allPrices.push(point.close);
      }
    });
    
    // Also include forecast data if available
    [simpleForecastData, arimaForecastData, prophetForecastData, lstmForecastData].forEach(({ forecastData }) => {
      forecastData.forEach((point: any) => {
        if (point && point.close && !isNaN(point.close) && point.close > 0) {
          allPrices.push(point.close);
        }
      });
    });
    
    if (allPrices.length === 0) {
      // Return null to trigger auto domain calculation in HistoricalChart
      if (import.meta.env.DEV) {
        console.warn('[ChartPreview] No prices available for Y-domain calculation, will use auto');
      }
      return null as any; // Return null to trigger fallback in HistoricalChart
    }
    
    const sorted = [...allPrices].sort((a, b) => a - b);
    const minPrice = sorted[0];
    const maxPrice = sorted[sorted.length - 1];
    
    // Validate prices are reasonable
    if (minPrice <= 0 || maxPrice <= 0 || isNaN(minPrice) || isNaN(maxPrice) || minPrice >= maxPrice) {
      if (import.meta.env.DEV) {
        console.warn('[ChartPreview] Invalid price range for Y-domain, will use auto', { minPrice, maxPrice });
      }
      return null as any;
    }
    
    // Use actual min/max with padding - don't extend below actual data
    const padding = (maxPrice - minPrice) * 0.05;
    
    const domain: [number, number] = [
      Math.max(0, minPrice - padding), 
      maxPrice + padding
    ];
    
    // Final validation
    if (domain[0] >= domain[1] || isNaN(domain[0]) || isNaN(domain[1]) || domain[0] < 0) {
      if (import.meta.env.DEV) {
        console.warn('[ChartPreview] Invalid calculated domain, will use auto', domain);
      }
      return null as any;
    }
    
    if (import.meta.env.DEV) {
      console.log(`[ChartPreview] Y-axis domain calculated: [${domain[0].toFixed(2)}, ${domain[1].toFixed(2)}] from ${allPrices.length} prices (min: ${minPrice.toFixed(2)}, max: ${maxPrice.toFixed(2)})`);
    }
    
    return domain;
  }, [allChartData, simpleForecastData, arimaForecastData, prophetForecastData, lstmForecastData]);

  // Process forecast data for active forecast - must be before early returns
  const activeForecastData = useMemo(() => {
    if (!forecastEnabled || !activeForecast) {
      return { forecastData: [], fullForecastData: [] };
    }
    return processForecastData(activeForecast);
  }, [forecastEnabled, activeForecast, processForecastData]);

  // Calculate history tail for forecast chart (last ~60 points) - MUST be before early returns
  const historyTail = useMemo(
    () => (allChartData ?? []).slice(-60).map((point: any) => ({
      dateTimestamp: point.dateTimestamp,
      close: point.close,
    })),
    [allChartData]
  );

  // Prepare forecast data for ForecastChart - MUST be before early returns
  const forecastDataForChart = useMemo(() => {
    if (!forecastEnabled || !activeForecast || activeForecastData.forecastData.length === 0) {
      return [];
    }
    // Return only forecast points (not the connector point)
    return activeForecastData.forecastData.map((point: any) => ({
      dateTimestamp: point.dateTimestamp,
      close: point.close, // This is the predicted value
      predicted: point.close, // Also set predicted for consistency
      forecastUpper: point.forecastUpper,
      forecastLower: point.forecastLower,
    }));
  }, [forecastEnabled, activeForecast, activeForecastData]);

  // Alert system is initialized by useAlerts hook above

  // Reset dismissed state when error changes
  useEffect(() => {
    setErrorDismissed(false);
  }, [error]);

  if (loading) {
    return (
      <div className="chart-preview">
        <div className="loading-state">Loading market data...</div>
      </div>
    );
  }
  
  if (error && !errorDismissed) {
    return (
      <div className="chart-preview">
        <div className="error-banner">
          <div className="error-content">
            <h3 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--accent-red)' }}>Error</h3>
            <p style={{ margin: 0, marginBottom: '0.75rem' }}>{error}</p>
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
        </div>
        {marketData.length === 0 && (
          <div className="empty-state">
            <h3>No Data</h3>
            <p>Enter a symbol to load market data</p>
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
          <p>Enter a symbol to load market data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-preview">
      {/* Alert Panel - Shows backend warnings and errors */}
      <AlertPanel />
      
      {/* Historical and Forecast charts in separate containers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minHeight: '500px' }}>
        {/* Historical Chart */}
        <div className="chart-container" style={chartTheme.containerStyle}>
          <HistoricalChart
            data={allChartData ?? []}
            emaEnabled={config.ema.enabled}
            emaPeriod={config.ema.period}
            volatilityBandsEnabled={config.volatilityBands.enabled}
            atrEnabled={config.atr.enabled}
            atrColor={config.atr.color}
            yDomain={yDomain}
            atrDomain={atrDomain}
            volumeDomain={volumeDomain}
            atrThreshold={atrThresholds.high}
            todayTimestamp={todayTimestamp}
            signals={signals}
            marketData={marketData}
            supportResistance={supportResistance}
            latestATRStopLoss={chartData.length > 0 ? chartData[chartData.length - 1]?.atrStopLossLong : undefined}
          />
        </div>

        {/* Forecast Chart */}
        {forecastEnabled && activeForecast && forecastDataForChart.length > 0 && (
          <div className="chart-container" style={{ ...chartTheme.containerStyle, height: '260px', minHeight: '260px' }}>
            <ForecastChart
              historyTail={historyTail}
              forecast={forecastDataForChart}
            />
          </div>
        )}
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
            
            {/* Forecast Panel - Right Side - Show active forecast model */}
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

