/**
 * Forecast Layer Component
 * Renders forecast lines and confidence intervals
 */

import React from 'react';
import { Area, Line } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';
import { ForecastResult } from '../../types/forecast';

interface ForecastLayerProps {
  forecast: ForecastResult;
  forecastData: Array<{
    dateTimestamp: number;
    close: number;
    forecastUpper: number;
    forecastLower: number;
  }>;
}

export const ForecastLayer: React.FC<ForecastLayerProps> = ({ forecast, forecastData }) => {
  return (
    <>
      <defs>
        <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartTheme.colors.forecast} stopOpacity={0.2}/>
          <stop offset="95%" stopColor={chartTheme.colors.forecast} stopOpacity={0.05}/>
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="forecastUpper"
        stroke="none"
        fill="url(#forecastGradient)"
        data={forecastData}
        connectNulls={true}
        name={`${(forecast.confidence * 100).toFixed(0)}% CI`}
        isAnimationActive={false}
      />
      <Line
        yAxisId="left"
        type="monotone"
        dataKey="close"
        stroke={chartTheme.lineStyles.forecast.stroke}
        strokeWidth={chartTheme.lineStyles.forecast.strokeWidth}
        strokeDasharray={chartTheme.lineStyles.forecast.strokeDasharray}
        name="Forecast"
        dot={false}
        data={forecastData}
        connectNulls={true}
        isAnimationActive={false}
      />
      <Line
        yAxisId="left"
        type="monotone"
        dataKey="forecastUpper"
        stroke={chartTheme.lineStyles.forecastBound.stroke}
        strokeWidth={chartTheme.lineStyles.forecastBound.strokeWidth}
        strokeDasharray={chartTheme.lineStyles.forecastBound.strokeDasharray}
        strokeOpacity={chartTheme.lineStyles.forecastBound.strokeOpacity}
        dot={false}
        data={forecastData}
        connectNulls={true}
        isAnimationActive={false}
      />
      <Line
        yAxisId="left"
        type="monotone"
        dataKey="forecastLower"
        stroke={chartTheme.lineStyles.forecastBound.stroke}
        strokeWidth={chartTheme.lineStyles.forecastBound.strokeWidth}
        strokeDasharray={chartTheme.lineStyles.forecastBound.strokeDasharray}
        strokeOpacity={chartTheme.lineStyles.forecastBound.strokeOpacity}
        dot={false}
        data={forecastData}
        connectNulls={true}
        isAnimationActive={false}
      />
    </>
  );
};

