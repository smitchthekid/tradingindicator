/**
 * Chart Axes Component
 * Handles all Y-axis and X-axis rendering
 */

import React from 'react';
import { XAxis, YAxis } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';

interface ChartAxesProps {
  yDomain: [number, number];
  atrDomain: [number, number];
  volumeDomain: [number, number];
  atrEnabled: boolean;
  atrColor?: string;
}

export const ChartAxes: React.FC<ChartAxesProps> = ({
  yDomain,
  atrDomain,
  volumeDomain,
  atrEnabled,
  atrColor,
}) => {
  return (
    <>
      <XAxis
        dataKey="dateTimestamp"
        type="number"
        scale="time"
        stroke={chartTheme.axes.stroke}
        tick={chartTheme.axes.tick}
        interval="preserveStartEnd"
        angle={-45}
        textAnchor="end"
        height={80}
        domain={['dataMin', 'dataMax']}
        allowDataOverflow={false}
        tickFormatter={(value) => {
          if (!value || isNaN(value)) return '';
          const date = new Date(value);
          if (isNaN(date.getTime())) return '';
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }}
      />
      <YAxis
        yAxisId="left"
        stroke={chartTheme.axes.stroke}
        tick={chartTheme.axes.tick}
        domain={yDomain}
        allowDataOverflow={false}
        width={80}
        tickFormatter={(value) => {
          if (isNaN(value) || value === null || value === undefined) return '';
          const formatted = value >= 1000 
            ? `$${(value / 1000).toFixed(1)}K`
            : value >= 1
            ? `$${value.toFixed(2)}`
            : `$${value.toFixed(4)}`;
          return formatted;
        }}
      />
      {atrEnabled && (
        <YAxis
          yAxisId="atr"
          orientation="right"
          stroke={atrColor || chartTheme.colors.atr}
          tick={{ fill: atrColor || chartTheme.colors.atr, fontSize: 10 }}
          domain={atrDomain}
          width={60}
          tickFormatter={(value) => {
            if (isNaN(value) || value === null || value === undefined) return '';
            return value.toFixed(2);
          }}
          label={{ 
            value: 'ATR', 
            angle: -90, 
            position: 'insideRight', 
            style: { textAnchor: 'middle', fill: atrColor || chartTheme.colors.atr } 
          }}
        />
      )}
      <YAxis
        yAxisId="volume"
        orientation="right"
        stroke={chartTheme.colors.text}
        tick={{ fill: chartTheme.colors.text, fontSize: 9 }}
        domain={volumeDomain}
        width={50}
        tickFormatter={(value) => {
          if (isNaN(value) || value === null || value === undefined) return '';
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
          return value.toString();
        }}
        label={{ 
          value: 'Volume', 
          angle: -90, 
          position: 'insideRight', 
          style: { textAnchor: 'middle', fill: chartTheme.colors.text } 
        }}
      />
    </>
  );
};

