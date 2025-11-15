// src/components/NewChart/ChartRenderer.tsx

import React, { useMemo } from 'react';
import {
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Scatter,
} from 'recharts';
import { ChartDataPoint, ForecastPoint, SignalIndicator, FibonacciLevel } from './types';
import { PriceLine } from './layers/PriceLine';
import { VolumeBars } from './layers/VolumeBars';
import { EmaLine } from './layers/EmaLine';
import { ForecastLine } from './layers/ForecastLine';
import { FibonacciLevels } from './layers/FibonacciLevels';

interface ChartRendererProps {
  data: ChartDataPoint[];
  forecastData: ForecastPoint[];
  signals: SignalIndicator[];
  fibonacciLevels: FibonacciLevel[];
  dataRange: { min: number; max: number };
}

// Custom shape for buy/sell indicators
const BuySellShape = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  
  const isBuy = payload.type === 'BUY';
  const isForecast = payload.isForecast;
  
  // Triangle pointing up for BUY, down for SELL
  const size = isForecast ? 12 : 10;
  const points = isBuy
    ? `${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`
    : `${cx},${cy + size} ${cx - size},${cy - size} ${cx + size},${cy - size}`;
  
  return (
    <g>
      <polygon
        points={points}
        fill={isBuy ? '#10B981' : '#EF4444'}
        stroke={isBuy ? '#059669' : '#DC2626'}
        strokeWidth={isForecast ? 2 : 1.5}
        opacity={isForecast ? 0.9 : 0.8}
      />
      {isForecast && (
        <circle
          cx={cx}
          cy={cy}
          r={size + 3}
          fill="none"
          stroke={isBuy ? '#10B981' : '#EF4444'}
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.5}
        />
      )}
    </g>
  );
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({ 
  data, 
  forecastData, 
  signals, 
  fibonacciLevels,
  dataRange 
}) => {
  // Combine historical and forecast data for the chart
  const combinedData = useMemo(() => {
    const historical = data.map(d => ({
      ...d,
      predicted: undefined,
    }));
    
    const forecast = forecastData.map(f => ({
      dateTimestamp: f.dateTimestamp,
      close: f.predicted,
      predicted: f.predicted,
      isForecast: true,
    }));
    
    return [...historical, ...forecast].sort((a, b) => a.dateTimestamp - b.dateTimestamp);
  }, [data, forecastData]);

  // Transform signals for scatter plot
  const signalData = useMemo(() => {
    return signals.map(signal => ({
      x: signal.dateTimestamp,
      y: signal.price,
      type: signal.type,
      isForecast: signal.isForecast,
    }));
  }, [signals]);

  // Calculate domain for X axis to include forecast data
  const xDomain = useMemo(() => {
    const allTimestamps = [
      ...data.map(d => d.dateTimestamp),
      ...forecastData.map(f => f.dateTimestamp),
    ];
    return [Math.min(...allTimestamps), Math.max(...allTimestamps)];
  }, [data, forecastData]);

  return (
    <ResponsiveContainer width="100%" height={500}>
      <ComposedChart 
        data={combinedData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        {/* Defs for gradients, patterns, etc. can go here */}

        {/* Axes */}
        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
        <XAxis
          dataKey="dateTimestamp"
          type="number"
          scale="time"
          domain={xDomain}
          tickFormatter={(timeStr) => new Date(timeStr).toLocaleDateString()}
          stroke="#A0AEC0"
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          domain={['auto', 'auto']}
          stroke="#A0AEC0"
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          domain={['auto', 'auto']}
          tickFormatter={(vol) => `${(vol / 1000).toFixed(0)}k`}
          stroke="#A0AEC0"
        />
        
        {/* Tooltip and Legend */}
        <Tooltip
          contentStyle={{ backgroundColor: '#2D3748', border: 'none' }}
          labelStyle={{ color: '#E2E8F0' }}
          formatter={(value: any, name: string) => {
            if (name === 'predicted') return [value?.toFixed(2), 'Forecast'];
            return [value, name];
          }}
        />
        <Legend wrapperStyle={{ color: '#E2E8F0' }} />

        {/* Fibonacci Retracement Levels */}
        <FibonacciLevels levels={fibonacciLevels} dataRange={dataRange} />

        {/* Historical Data Layers */}
        <PriceLine />
        <EmaLine />
        <VolumeBars data={data} />

        {/* Forecast Line - only shows predicted values from forecast data points */}
        {forecastData.length > 0 && (
          <ForecastLine forecastData={forecastData} />
        )}

        {/* Buy/Sell Indicators */}
        {signals.length > 0 && (
          <Scatter
            yAxisId="left"
            data={signalData}
            dataKey="y"
            shape={BuySellShape}
            isAnimationActive={false}
          />
        )}
        
      </ComposedChart>
    </ResponsiveContainer>
  );
};

