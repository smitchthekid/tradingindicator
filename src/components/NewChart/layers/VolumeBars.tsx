// src/components/NewChart/layers/VolumeBars.tsx
import React from 'react';
import { Bar, Cell } from 'recharts';
import { ChartLayerProps } from '../types';

export const VolumeBars: React.FC<ChartLayerProps> = ({ data }) => (
  <Bar yAxisId="volume" dataKey="volume" name="Volume" isAnimationActive={false}>
    {data.map((entry, index) => (
      <Cell
        key={`cell-${index}`}
        fill={entry.isUpDay ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}
      />
    ))}
  </Bar>
);

