// src/components/NewChart/layers/FibonacciLevels.tsx
import React from 'react';
import { ReferenceLine } from 'recharts';
import { FibonacciLayerProps } from '../types';

export const FibonacciLevels: React.FC<FibonacciLayerProps> = ({ levels }) => {
  return (
    <>
      {levels.map((fibLevel, index) => {
        // Color coding: 0% and 100% are typically stronger levels
        const isKeyLevel = fibLevel.percentage === 0 || fibLevel.percentage === 50 || fibLevel.percentage === 100;
        const strokeColor = isKeyLevel ? '#F59E0B' : '#8B5CF6';
        const strokeWidth = isKeyLevel ? 2 : 1;
        const strokeDasharray = isKeyLevel ? '5 5' : '3 3';
        
        return (
          <ReferenceLine
            key={`fib-${index}`}
            yAxisId="left"
            y={fibLevel.level}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeOpacity={0.6}
            label={{
              value: `${fibLevel.label} (${fibLevel.level.toFixed(2)})`,
              position: 'right',
              fill: strokeColor,
              fontSize: 11,
            }}
          />
        );
      })}
    </>
  );
};

