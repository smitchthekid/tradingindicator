/**
 * SimpleChart - Minimal working chart implementation
 * Accepts real data and renders price line
 */

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import { chartTheme } from '../../styles/chartTheme';
import { SupportResistance, TradingSignal } from '../../types';

interface ChartDataPoint {
  dateTimestamp: number;
  close: number;
  volume?: number;
  ema?: number;
  atr?: number;
  upperBand?: number;
  lowerBand?: number;
  [key: string]: unknown;
}

interface SimpleChartProps {
  data?: ChartDataPoint[];
  emaEnabled?: boolean;
  atrEnabled?: boolean;
  atrColor?: string;
  volatilityBandsEnabled?: boolean;
  supportResistance?: SupportResistance[];
  signals?: TradingSignal[];
  latestATRStopLoss?: number;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({ 
  data = [], 
  emaEnabled = false,
  atrEnabled = false,
  atrColor,
  volatilityBandsEnabled = false,
  supportResistance = [],
  signals = [],
  latestATRStopLoss,
}) => {
  // Calculate Y-axis domain from data
  const yDomain = useMemo(() => {
    if (!data || data.length === 0) return ['auto', 'auto'] as [string, string];
    
    const prices = data
      .map((point) => point.close)
      .filter((price) => !isNaN(price) && price > 0);
    
    if (prices.length === 0) return ['auto', 'auto'] as [string, string];
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const padding = (maxPrice - minPrice) * 0.1;
    
    return [
      Math.max(0, minPrice - padding),
      maxPrice + padding,
    ] as [number, number];
  }, [data]);

  // Calculate volume domain for secondary Y-axis
  const volumeDomain = useMemo(() => {
    if (!data || data.length === 0) return [0, 100] as [number, number];
    
    const volumes = data
      .map((point) => point.volume || 0)
      .filter((vol) => !isNaN(vol) && vol > 0);
    
    if (volumes.length === 0) return [0, 100] as [number, number];
    
    const maxVolume = Math.max(...volumes);
    return [0, maxVolume] as [number, number];
  }, [data]);

  // Calculate ATR domain for secondary Y-axis
  const atrDomain = useMemo(() => {
    if (!atrEnabled || !data || data.length === 0) return [0, 100] as [number, number];
    
    const atrs = data
      .map((point) => point.atr || 0)
      .filter((atr) => !isNaN(atr) && atr > 0);
    
    if (atrs.length === 0) return [0, 100] as [number, number];
    
    const minATR = Math.min(...atrs);
    const maxATR = Math.max(...atrs);
    const padding = (maxATR - minATR) * 0.1;
    
    return [
      Math.max(0, minATR - padding),
      maxATR + padding,
    ] as [number, number];
  }, [atrEnabled, data]);

  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: chartTheme.colors.text,
        fontSize: '1rem',
      }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={atrEnabled ? chartTheme.margins.withATR : chartTheme.margins.default}
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
          yAxisId="left"
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
        
        <YAxis
          yAxisId="volume"
          orientation="right"
          domain={volumeDomain}
          stroke={chartTheme.axes.stroke}
          tick={chartTheme.axes.tick}
          width={60}
        />
        
        {atrEnabled && (
          <YAxis
            yAxisId="atr"
            orientation="right"
            domain={atrDomain}
            stroke={atrColor || chartTheme.colors.atr}
            tick={{ fill: atrColor || chartTheme.colors.atr, fontSize: 10 }}
            width={60}
            tickFormatter={(value: number) => {
              if (isNaN(value) || value === null || value === undefined) return '';
              return value.toFixed(2);
            }}
          />
        )}
        
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
          formatter={(value: number, name: string) => {
            if (name === 'Volume') {
              return [value.toLocaleString(), 'Volume'];
            }
            if (typeof value === 'number' && !isNaN(value)) {
              return [`$${value.toFixed(2)}`, name];
            }
            return [value, name];
          }}
        />
        
        <Legend
          wrapperStyle={chartTheme.legend.wrapperStyle}
          iconType={chartTheme.legend.iconType}
          formatter={(value: string) => value}
        />
        
        <Bar
          yAxisId="volume"
          dataKey="volume"
          name="Volume"
          radius={chartTheme.volumeBar.radius}
        >
          {data.map((entry: ChartDataPoint, index: number) => (
            <Cell
              key={`volume-cell-${index}`}
              fill={
                entry.isUpDay
                  ? chartTheme.colors.volumeUp
                  : chartTheme.colors.volumeDown
              }
            />
          ))}
        </Bar>
        
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="close"
          stroke={chartTheme.lineStyles.price.stroke}
          strokeWidth={chartTheme.lineStyles.price.strokeWidth}
          dot={false}
          name="Price"
          connectNulls={true}
        />
        
        {emaEnabled && (
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ema"
            stroke={chartTheme.lineStyles.ema.stroke}
            strokeWidth={chartTheme.lineStyles.ema.strokeWidth}
            dot={false}
            name="EMA"
            connectNulls={true}
          />
        )}
        
        {atrEnabled && (
          <Line
            yAxisId="atr"
            type="monotone"
            dataKey="atr"
            stroke={atrColor || chartTheme.lineStyles.atr.stroke}
            strokeWidth={chartTheme.lineStyles.atr.strokeWidth}
            strokeOpacity={chartTheme.lineStyles.atr.strokeOpacity}
            dot={false}
            name="ATR"
            connectNulls={false}
          />
        )}
        
        {volatilityBandsEnabled && (
          <>
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="upperBand"
              stroke={chartTheme.lineStyles.band.stroke}
              strokeWidth={chartTheme.lineStyles.band.strokeWidth}
              strokeDasharray={chartTheme.lineStyles.band.strokeDasharray}
              strokeOpacity={chartTheme.lineStyles.band.strokeOpacity}
              dot={false}
              name="Upper Band"
              connectNulls={true}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="lowerBand"
              stroke={chartTheme.lineStyles.band.stroke}
              strokeWidth={chartTheme.lineStyles.band.strokeWidth}
              strokeDasharray={chartTheme.lineStyles.band.strokeDasharray}
              strokeOpacity={chartTheme.lineStyles.band.strokeOpacity}
              dot={false}
              name="Lower Band"
              connectNulls={true}
            />
          </>
        )}
        
        {/* Support/Resistance Lines */}
        {supportResistance.map((sr, index) => (
          <ReferenceLine
            key={`sr-${index}`}
            yAxisId="left"
            y={sr.level}
            stroke={sr.type === 'support' ? chartTheme.colors.support : chartTheme.colors.resistance}
            strokeWidth={chartTheme.referenceLine.supportResistance.strokeWidth}
            strokeDasharray={chartTheme.referenceLine.supportResistance.strokeDasharray}
            strokeOpacity={chartTheme.referenceLine.supportResistance.strokeOpacity}
            label={{
              value: `${sr.type === 'support' ? 'Support' : 'Resistance'}: $${sr.level.toFixed(2)}`,
              position: 'right',
              fill: sr.type === 'support' ? chartTheme.colors.support : chartTheme.colors.resistance,
              fontSize: 10,
            }}
          />
        ))}
        
        {/* ATR Stop Loss Line */}
        {latestATRStopLoss !== undefined && (
          <ReferenceLine
            yAxisId="left"
            y={latestATRStopLoss}
            stroke={chartTheme.referenceLine.stopLoss.stroke}
            strokeWidth={chartTheme.referenceLine.stopLoss.strokeWidth}
            strokeDasharray={chartTheme.referenceLine.stopLoss.strokeDasharray}
            strokeOpacity={chartTheme.referenceLine.stopLoss.strokeOpacity}
            label={{
              value: `Stop Loss: $${latestATRStopLoss.toFixed(2)}`,
              position: 'right',
              fill: chartTheme.referenceLine.stopLoss.stroke,
              fontSize: 10,
            }}
          />
        )}
        
        {/* Trading Signals */}
        {signals.map((signal, index) => {
          const dataPoint = data.find((point) => {
            const pointDate = new Date(point.dateTimestamp);
            const signalDate = new Date(signal.date);
            return pointDate.getTime() === signalDate.getTime();
          });
          
          if (!dataPoint) return null;
          
          return (
            <ReferenceLine
              key={`signal-${index}`}
              x={dataPoint.dateTimestamp}
              stroke={signal.type === 'BUY' ? chartTheme.colors.buy : chartTheme.colors.sell}
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: signal.type,
                position: signal.type === 'BUY' ? 'top' : 'bottom',
                fill: signal.type === 'BUY' ? chartTheme.colors.buy : chartTheme.colors.sell,
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />
          );
        })}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

