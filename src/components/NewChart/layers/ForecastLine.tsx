// src/components/NewChart/layers/ForecastLine.tsx
import React from 'react';
import { Line } from 'recharts';
import { ForecastLayerProps } from '../types';

export const ForecastLine: React.FC<ForecastLayerProps> = ({ forecastData }) => {
  return (
    <Line
      yAxisId="left"
      type="monotone"
      dataKey="predicted"
      stroke="#10B981"
      strokeWidth={2}
      strokeDasharray="5 5"
      dot={false}
      name="Forecast"
      isAnimationActive={false}
      connectNulls={false}
    />
  );
};

