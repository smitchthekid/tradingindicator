/**
 * Volume Layer Component
 * Renders volume bars with conditional coloring
 */

import React from 'react';
import { Bar, Cell } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';

interface VolumeLayerProps {
  allChartData: Array<{ dateTimestamp: number; volume?: number; isUpDay?: boolean }>;
}

export const VolumeLayer: React.FC<VolumeLayerProps> = ({ allChartData }) => {
  return (
    <Bar
      yAxisId="volume"
      dataKey="volume"
      name="Volume"
      radius={chartTheme.volumeBar.radius}
      isAnimationActive={false}
    >
      {allChartData.map((entry, index: number) => (
        <Cell
          key={`volume-cell-${index}`}
          fill={entry.isUpDay ? chartTheme.colors.volumeUp : chartTheme.colors.volumeDown}
        />
      ))}
    </Bar>
  );
};

