/**
 * ATR Layer Component
 * Renders ATR line on secondary Y-axis
 */

import React from 'react';
import { Line } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';

interface ATRLayerProps {
  atrColor?: string;
}

export const ATRLayer: React.FC<ATRLayerProps> = ({ atrColor }) => {
  return (
    <Line
      yAxisId="atr"
      type="monotone"
      dataKey="atr"
      stroke={atrColor || chartTheme.colors.atr}
      strokeWidth={chartTheme.lineStyles.atr.strokeWidth}
      strokeOpacity={chartTheme.lineStyles.atr.strokeOpacity}
      name="ATR"
      dot={false}
      connectNulls={false}
      isAnimationActive={false}
    />
  );
};

