/**
 * Chart Legend Component
 * Custom legend with grouped items
 */

import React from 'react';
import { Legend } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';

export const ChartLegend: React.FC = () => {
  return (
    <Legend 
      wrapperStyle={chartTheme.legend.wrapperStyle}
      iconType={chartTheme.legend.iconType}
      formatter={(value) => {
        // Group forecast items
        if (value.includes('Forecast') || value.includes('CI') || value.includes('forecast')) {
          return null; // Hide individual forecast items, we'll show grouped
        }
        return value;
      }}
      content={({ payload }) => {
        if (!payload || payload.length === 0) return null;
        
        // Separate items into groups
        const priceItems = payload.filter(item => 
          item.value === 'Close Price' || item.value === 'Price'
        );
        const indicatorItems = payload.filter(item => 
          item.value?.includes('EMA') || item.value?.includes('ATR') || 
          item.value?.includes('Band') || item.value?.includes('Upper') || item.value?.includes('Lower')
        );
        const forecastItems = payload.filter(item => 
          item.value?.includes('Forecast') || item.value?.includes('CI') || 
          item.value?.includes('forecast')
        );
        
        return (
          <div style={chartTheme.legend.containerStyle}>
            {/* Price Data */}
            {priceItems.length > 0 && (
              <div style={chartTheme.legend.groupStyle}>
                {priceItems.map((entry, index) => (
                  <span key={index} style={chartTheme.legend.itemStyle}>
                    <span style={{
                      ...chartTheme.legend.iconStyle,
                      backgroundColor: entry.color || chartTheme.colors.primary,
                      borderStyle: entry.payload?.strokeDasharray ? 'dashed' : 'solid'
                    }}></span>
                    <span>{entry.value}</span>
                  </span>
                ))}
              </div>
            )}
            
            {/* Indicators */}
            {indicatorItems.length > 0 && (
              <div style={chartTheme.legend.groupStyle}>
                {indicatorItems.map((entry, index) => (
                  <span key={index} style={chartTheme.legend.itemStyle}>
                    <span style={{
                      ...chartTheme.legend.iconStyle,
                      backgroundColor: entry.color || chartTheme.colors.ema,
                      borderStyle: entry.payload?.strokeDasharray ? 'dashed' : 'solid'
                    }}></span>
                    <span>{entry.value}</span>
                  </span>
                ))}
              </div>
            )}
            
            {/* Forecast Group */}
            {forecastItems.length > 0 && (
              <div style={chartTheme.legend.forecastGroupStyle}>
                <div style={chartTheme.legend.forecastLabelStyle}>
                  Forecast
                </div>
                <div style={chartTheme.legend.groupStyle}>
                  {forecastItems.map((entry, index) => (
                    <span key={index} style={chartTheme.legend.itemStyle}>
                      <span style={{
                        ...chartTheme.legend.iconStyle,
                        backgroundColor: entry.color || chartTheme.colors.forecast,
                        borderStyle: entry.payload?.strokeDasharray ? 'dashed' : 'solid',
                        opacity: (entry.payload as any)?.strokeOpacity || 1
                      }}></span>
                      <span>{entry.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

