// src/components/NewChart/layers/PriceLine.tsx
import React from 'react';
import { Line } from 'recharts';
import { ChartLayerProps } from '../types';

export const PriceLine: React.FC = () => (
  <Line
    yAxisId="left"
    type="monotone"
    dataKey="close"
    stroke="#F1F5F9"
    strokeWidth={2}
    dot={false}
    name="Price"
    isAnimationActive={false}
  />
);

