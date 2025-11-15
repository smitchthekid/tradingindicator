/**
 * EMA Layer Component
 * Renders EMA line
 */

import React from 'react';
import { Line } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';

interface EMALayerProps {
  emaPeriod: number;
}

export const EMALayer: React.FC<EMALayerProps> = ({ emaPeriod }) => {
  return (
    <Line
      yAxisId="left"
      type="monotone"
      dataKey="ema"
      stroke={chartTheme.lineStyles.ema.stroke}
      strokeWidth={chartTheme.lineStyles.ema.strokeWidth}
      name={`EMA(${emaPeriod})`}
      dot={false}
      isAnimationActive={false}
    />
  );
};

