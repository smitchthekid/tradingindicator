// src/components/NewChart/layers/VolatilityBands.tsx
import React from 'react';
import { Line } from 'recharts';

export const VolatilityBands: React.FC = () => (
  <>
    <Line
      yAxisId="left"
      type="monotone"
      dataKey="upperBand"
      stroke="#8B5CF6"
      strokeWidth={1.5}
      strokeOpacity={0.5}
      strokeDasharray="3 3"
      dot={false}
      name="Upper Band"
      isAnimationActive={false}
    />
    <Line
      yAxisId="left"
      type="monotone"
      dataKey="lowerBand"
      stroke="#8B5CF6"
      strokeWidth={1.5}
      strokeOpacity={0.5}
      strokeDasharray="3 3"
      dot={false}
      name="Lower Band"
      isAnimationActive={false}
    />
  </>
);

