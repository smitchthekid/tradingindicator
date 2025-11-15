// src/components/NewChart/layers/EmaLine.tsx
import React from 'react';
import { Line } from 'recharts';

export const EmaLine: React.FC = () => (
  <Line
    yAxisId="left"
    type="monotone"
    dataKey="ema"
    stroke="#14B8A6"
    strokeWidth={1.5}
    dot={false}
    name="EMA"
    isAnimationActive={false}
  />
);

