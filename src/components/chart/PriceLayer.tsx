/**
 * Price Layer Component
 * Renders the main price line
 */

import React from 'react';
import { Line } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';

export const PriceLayer: React.FC = () => {
  // Note: data prop is not needed here - ComposedChart parent provides the data
  // All chart data comes from the parent ComposedChart's data prop
  if (import.meta.env.DEV) {
    console.log('[PriceLayer] Rendering with dataKey="close"');
  }
  return (
    <Line
      yAxisId="left"
      type="monotone"
      dataKey="close"
      stroke={chartTheme.lineStyles.price.stroke}
      strokeWidth={chartTheme.lineStyles.price.strokeWidth}
      name="Close Price"
      dot={false}
      connectNulls={true}
      isAnimationActive={false}
      strokeOpacity={1}
      activeDot={{ r: 4 }}
    />
  );
};

