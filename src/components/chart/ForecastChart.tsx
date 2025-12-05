/**
 * ForecastChart - Separate component for forecast visualization
 * Renders forecast data with confidence bands
 */

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { chartTheme } from '../../styles/chartTheme';

interface ForecastPoint {
  dateTimestamp: number;
  close: number;
  forecastLower?: number;
  forecastUpper?: number;
  isForecast?: boolean;
  isConnector?: boolean;
  [key: string]: unknown;
}

interface ForecastChartProps {
  historyTail?: ForecastPoint[];
  forecast?: ForecastPoint[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  historyTail = [],
  forecast = [],
}) => {
  // Combine history tail and forecast data
  const chartData = useMemo(() => {
    return [...historyTail, ...forecast];
  }, [historyTail, forecast]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return ['auto', 'auto'] as [string, string];
    
    const allValues: number[] = [];
    chartData.forEach((point) => {
      if (point.close && !isNaN(point.close)) allValues.push(point.close);
      if (point.forecastLower && !isNaN(point.forecastLower)) allValues.push(point.forecastLower);
      if (point.forecastUpper && !isNaN(point.forecastUpper)) allValues.push(point.forecastUpper);
    });
    
    if (allValues.length === 0) return ['auto', 'auto'] as [string, string];
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.1;
    
    return [
      Math.max(0, minValue - padding),
      maxValue + padding,
    ] as [number, number];
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: chartTheme.colors.text,
        fontSize: '1rem',
      }}>
        No forecast data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={chartTheme.margins.default}
      >
        <CartesianGrid
          strokeDasharray={chartTheme.grid.strokeDasharray}
          stroke={chartTheme.grid.stroke}
          strokeOpacity={chartTheme.grid.strokeOpacity}
        />
        
        <XAxis
          dataKey="dateTimestamp"
          type="number"
          scale="linear"
          domain={['dataMin', 'dataMax']}
          stroke={chartTheme.axes.stroke}
          tick={chartTheme.axes.tick}
          tickFormatter={(value: number) => {
            if (!value || isNaN(value)) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
          }}
        />
        
        <YAxis
          domain={yDomain}
          stroke={chartTheme.axes.stroke}
          tick={chartTheme.axes.tick}
          tickFormatter={(value: number) => {
            if (isNaN(value) || value === null || value === undefined) return '';
            return value >= 1000
              ? `$${(value / 1000).toFixed(1)}K`
              : value >= 1
              ? `$${value.toFixed(2)}`
              : `$${value.toFixed(4)}`;
          }}
        />
        
        <Tooltip
          contentStyle={chartTheme.tooltip}
          labelFormatter={(value: number) => {
            if (!value || isNaN(value)) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          }}
          formatter={(value: number) => `$${value.toFixed(2)}`}
        />
        
        {/* Historical tail line - only show for non-forecast points */}
        <Line
          type="monotone"
          dataKey="close"
          stroke={chartTheme.lineStyles.price.stroke}
          strokeWidth={chartTheme.lineStyles.price.strokeWidth}
          dot={false}
          name="Price"
          connectNulls={true}
          strokeOpacity={0.5}
          isAnimationActive={false}
        />
        
        {/* Forecast confidence band - using Area for upper/lower bounds */}
        {forecast.length > 0 && (
          <>
            <Area
              type="monotone"
              dataKey="forecastUpper"
              stroke="none"
              fill={chartTheme.colors.forecast}
              fillOpacity={0.1}
              connectNulls={true}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="forecastLower"
              stroke="none"
              fill={chartTheme.colors.forecast}
              fillOpacity={0.1}
              connectNulls={true}
              isAnimationActive={false}
            />
            
            {/* Forecast line - only for forecast points */}
            <Line
              type="monotone"
              dataKey="close"
              stroke={chartTheme.lineStyles.forecast.stroke}
              strokeWidth={chartTheme.lineStyles.forecast.strokeWidth}
              strokeDasharray={chartTheme.lineStyles.forecast.strokeDasharray}
              dot={false}
              name="Forecast"
              connectNulls={true}
              isAnimationActive={false}
            />
          </>
        )}
        
        {/* Connector line between history and forecast */}
        {chartData.find((p) => p.isConnector) && (
          <ReferenceLine
            x={chartData.find((p) => p.isConnector)?.dateTimestamp}
            stroke={chartTheme.colors.forecast}
            strokeWidth={2}
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

