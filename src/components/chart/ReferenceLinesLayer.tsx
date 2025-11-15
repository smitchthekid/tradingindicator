/**
 * Reference Lines Layer Component
 * Renders today marker, signals, stop-loss, targets, and support/resistance
 */

import React from 'react';
import { ReferenceLine } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';
import { TradingSignal, SupportResistance } from '../../types';

interface ReferenceLinesLayerProps {
  todayTimestamp: number;
  signals: TradingSignal[];
  chartData: Array<{ dateTimestamp: number; fullDate: string }>;
  marketData: Array<{ date: string }>;
  supportResistance: SupportResistance[];
  latestATRStopLoss?: number;
}

export const ReferenceLinesLayer: React.FC<ReferenceLinesLayerProps> = ({
  todayTimestamp,
  signals,
  chartData,
  marketData,
  supportResistance,
  latestATRStopLoss,
}) => {
  return (
    <>
      {/* Today marker */}
      {chartData.length > 0 && (
        <ReferenceLine
          x={todayTimestamp}
          stroke={chartTheme.referenceLine.today.stroke}
          strokeWidth={chartTheme.referenceLine.today.strokeWidth}
          strokeDasharray={chartTheme.referenceLine.today.strokeDasharray}
          strokeOpacity={chartTheme.referenceLine.today.strokeOpacity}
          label={{
            value: 'Today',
            position: 'top',
            fill: chartTheme.colors.text,
            fontSize: 11,
            fontWeight: 'bold',
            offset: 10,
          }}
        />
      )}
      
      {/* ATR-based Stop Loss */}
      {latestATRStopLoss && (
        <ReferenceLine
          yAxisId="left"
          y={latestATRStopLoss}
          stroke={chartTheme.referenceLine.stopLoss.stroke}
          strokeWidth={chartTheme.referenceLine.stopLoss.strokeWidth}
          strokeDasharray={chartTheme.referenceLine.stopLoss.strokeDasharray}
          strokeOpacity={chartTheme.referenceLine.stopLoss.strokeOpacity}
          label={{
            value: `ATR Stop: $${latestATRStopLoss.toFixed(2)}`,
            position: 'right',
            fill: chartTheme.referenceLine.stopLoss.stroke,
            fontSize: 9,
            fontWeight: '500',
          }}
        />
      )}
      
      {/* Signal markers */}
      {signals.map((signal, idx) => {
        const signalDataPoint = chartData.find(p => {
          const marketIdx = marketData.findIndex(m => m.date === p.fullDate);
          return marketIdx === signal.index;
        });
        if (!signalDataPoint || !signalDataPoint.dateTimestamp) return null;
        
        const isBuy = signal.type === 'BUY';
        const color = isBuy ? chartTheme.colors.buy : chartTheme.colors.sell;
        const signalPrice = signal.price;
        const iconSize = 22;
        const iconSymbol = isBuy ? '▲' : '▼';
        
        return (
          <React.Fragment key={`signal-${idx}`}>
            {/* Vertical line at signal point */}
            <ReferenceLine
              x={signalDataPoint.dateTimestamp}
              stroke={color}
              strokeWidth={chartTheme.referenceLine.signal.strokeWidth}
              strokeDasharray={chartTheme.referenceLine.signal.strokeDasharray}
              strokeOpacity={chartTheme.referenceLine.signal.strokeOpacity}
            />
            
            {/* Signal icon */}
            <ReferenceLine
              x={signalDataPoint.dateTimestamp}
              y={signalPrice}
              stroke={color}
              strokeWidth={0}
              label={{
                value: iconSymbol,
                position: 'inside',
                fill: color,
                fontSize: iconSize,
                fontWeight: 'bold',
                offset: 0,
              }}
            />
            
            {/* Stop-loss line */}
            {!isNaN(signal.stopLoss) && signal.stopLoss > 0 && (
              <ReferenceLine
                yAxisId="left"
                y={signal.stopLoss}
                stroke={chartTheme.referenceLine.stopLoss.stroke}
                strokeWidth={chartTheme.referenceLine.stopLoss.strokeWidth}
                strokeDasharray={chartTheme.referenceLine.stopLoss.strokeDasharray}
                strokeOpacity={chartTheme.referenceLine.stopLoss.strokeOpacity}
                label={{
                  value: `Stop $${signal.stopLoss.toFixed(2)}`,
                  position: 'right',
                  fill: chartTheme.referenceLine.stopLoss.stroke,
                  fontSize: 9,
                  fontWeight: '500',
                }}
              />
            )}
            
            {/* Target line */}
            {!isNaN(signal.target) && signal.target > 0 && (
              <ReferenceLine
                yAxisId="left"
                y={signal.target}
                stroke={chartTheme.referenceLine.target.stroke}
                strokeWidth={chartTheme.referenceLine.target.strokeWidth}
                strokeDasharray={chartTheme.referenceLine.target.strokeDasharray}
                strokeOpacity={chartTheme.referenceLine.target.strokeOpacity}
                label={{
                  value: `Target $${signal.target.toFixed(2)}`,
                  position: 'right',
                  fill: chartTheme.referenceLine.target.stroke,
                  fontSize: 9,
                  fontWeight: '500',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
      
      {/* Support/Resistance levels */}
      {supportResistance.slice(0, 3).map((level, idx) => {
        if (!level || isNaN(level.level)) return null;
        return (
          <ReferenceLine
            key={`sr-${level.type}-${level.level.toFixed(2)}-${idx}`}
            yAxisId="left"
            y={level.level}
            stroke={level.type === 'support' ? chartTheme.colors.support : chartTheme.colors.resistance}
            strokeWidth={chartTheme.referenceLine.supportResistance.strokeWidth}
            strokeDasharray={chartTheme.referenceLine.supportResistance.strokeDasharray}
            strokeOpacity={chartTheme.referenceLine.supportResistance.strokeOpacity}
            label={{
              value: `${level.type === 'support' ? 'S' : 'R'}: $${level.level.toFixed(2)}`,
              position: 'right',
              fill: level.type === 'support' ? chartTheme.colors.support : chartTheme.colors.resistance,
              fontSize: 10,
            }}
          />
        );
      })}
    </>
  );
};

