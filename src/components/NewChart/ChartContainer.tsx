// src/components/NewChart/ChartContainer.tsx

import React from 'react';
import { useChartData } from './hooks/useChartData';
import { ChartRenderer } from './ChartRenderer';

export const ChartContainer: React.FC = () => {
  const { data, forecastData, signals, fibonacciLevels, loading, error } = useChartData();

  if (loading) {
    return <div>Loading Chart...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data || data.length === 0) {
    return <div>No data available to display.</div>;
  }

  // Calculate data range for Fibonacci levels
  const prices = data.map(d => d.close);
  const dataRange = {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };

  return (
    <ChartRenderer 
      data={data} 
      forecastData={forecastData}
      signals={signals}
      fibonacciLevels={fibonacciLevels}
      dataRange={dataRange}
    />
  );
};

