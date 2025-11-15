/**
 * Chart Tooltip Component
 * Enhanced tooltip with ATR and volume support
 */

import React from 'react';
import { Tooltip } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';
import { TradingSignal, OHLCVData } from '../../types';

interface ChartTooltipProps {
  signals: TradingSignal[];
  marketData: OHLCVData[];
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ signals, marketData }) => {
  return (
    <Tooltip
      contentStyle={chartTheme.tooltip}
      labelFormatter={(value) => {
        if (value && !isNaN(value)) {
          const date = new Date(value);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return '';
      }}
      formatter={(value: any, name: string, props: any) => {
        // Enhanced tooltip with ATR and volume
        if (props && props.payload) {
          const payload = props.payload;
          
          // Check if this is a signal point
          if (payload.signalType) {
            const signal = signals.find(s => {
              const marketIdx = marketData.findIndex(m => m.date === payload.fullDate);
              return marketIdx === s.index;
            });
            if (signal) {
              let tooltipText = `${signal.type} Signal\nEntry: $${signal.price.toFixed(2)}\nStop: $${signal.stopLoss.toFixed(2)}\nTarget: $${signal.target.toFixed(2)}\nR:R ${signal.riskRewardRatio.toFixed(2)}:1`;
              
              // Add ATR if available
              if (payload.atr && !isNaN(payload.atr)) {
                tooltipText += `\nATR: ${payload.atr.toFixed(2)}`;
              }
              
              // Add volume if available
              if (payload.volume && !isNaN(payload.volume)) {
                const vol = payload.volume >= 1000000 
                  ? `${(payload.volume / 1000000).toFixed(2)}M`
                  : payload.volume >= 1000
                  ? `${(payload.volume / 1000).toFixed(2)}K`
                  : payload.volume.toString();
                tooltipText += `\nVolume: ${vol}`;
              }
              
              return [tooltipText, name];
            }
          }
          
          // Format ATR values
          if (name === 'ATR' && typeof value === 'number') {
            return [value.toFixed(2), name];
          }
          
          // Format volume values
          if (name === 'Volume' && typeof value === 'number') {
            const vol = value >= 1000000 
              ? `${(value / 1000000).toFixed(2)}M`
              : value >= 1000
              ? `${(value / 1000).toFixed(2)}K`
              : value.toString();
            return [vol, name];
          }
          
          // Format price values
          if (typeof value === 'number' && (name.includes('Price') || name.includes('EMA') || name.includes('Band') || name.includes('Stop') || name.includes('Target'))) {
            return [`$${value.toFixed(2)}`, name];
          }
          
          // Default formatting
          if (typeof value === 'number') {
            return [`$${value.toFixed(2)}`, name];
          }
        }
        return [value, name];
      }}
    />
  );
};

