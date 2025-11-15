/**
 * Volatility Bands Layer Component
 * Renders upper and lower volatility bands
 */

import React from 'react';
import { Line } from 'recharts';
import { chartTheme } from '../../styles/chartTheme';

export const VolatilityBandsLayer: React.FC = () => {
  return (
    <>
      <Line
        yAxisId="left"
        type="monotone"
        dataKey="upperBand"
        stroke={chartTheme.lineStyles.band.stroke}
        strokeWidth={chartTheme.lineStyles.band.strokeWidth}
        strokeDasharray={chartTheme.lineStyles.band.strokeDasharray}
        strokeOpacity={chartTheme.lineStyles.band.strokeOpacity}
        name="Upper Band"
        dot={false}
        isAnimationActive={false}
      />
      <Line
        yAxisId="left"
        type="monotone"
        dataKey="lowerBand"
        stroke={chartTheme.lineStyles.band.stroke}
        strokeWidth={chartTheme.lineStyles.band.strokeWidth}
        strokeDasharray={chartTheme.lineStyles.band.strokeDasharray}
        strokeOpacity={chartTheme.lineStyles.band.strokeOpacity}
        name="Lower Band"
        dot={false}
        isAnimationActive={false}
      />
    </>
  );
};

