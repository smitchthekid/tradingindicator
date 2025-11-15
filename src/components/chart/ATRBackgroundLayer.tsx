/**
 * ATR Background Shading Layer
 * Highlights high volatility periods
 */

import React, { useMemo } from 'react';
import { ReferenceArea } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';

interface ATRBackgroundLayerProps {
  chartData: Array<{ atr?: number; dateTimestamp: number }>;
  atrThreshold: number | null;
  yDomain: [number, number];
}

export const ATRBackgroundLayer: React.FC<ATRBackgroundLayerProps> = ({
  chartData,
  atrThreshold,
  yDomain,
}) => {
  const highVolPeriods = useMemo(() => {
    if (!atrThreshold || chartData.length === 0) return [];
    
    const periods: Array<{ start: number; end: number }> = [];
    let currentPeriod: { start: number; end: number } | null = null;
    
    chartData.forEach((point) => {
      if (point.atr && point.atr > atrThreshold) {
        if (!currentPeriod) {
          currentPeriod = { start: point.dateTimestamp, end: point.dateTimestamp };
        } else {
          currentPeriod.end = point.dateTimestamp;
        }
      } else {
        if (currentPeriod) {
          periods.push(currentPeriod);
          currentPeriod = null;
        }
      }
    });
    
    if (currentPeriod) {
      periods.push(currentPeriod);
    }
    
    return periods;
  }, [chartData, atrThreshold]);
  
  if (highVolPeriods.length === 0) return null;
  
  return (
    <>
      {highVolPeriods.map((period, idx) => (
        <ReferenceArea
          key={`atr-high-${idx}`}
          x1={period.start}
          x2={period.end}
          y1={yDomain[0]}
          y2={yDomain[1]}
          fill={chartTheme.backgroundShading.highVolatility.fill}
          stroke={chartTheme.backgroundShading.highVolatility.stroke}
        />
      ))}
    </>
  );
};

