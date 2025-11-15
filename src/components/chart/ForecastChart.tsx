/**
 * Forecast Chart Component
 * Renders a short historical tail (close) plus forecast continuation (predicted).
 * Separate chart, separate axes, no shared ChartAxes or ForecastLayer.
 */

import React, { useMemo } from "react";
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  Area,
} from "recharts";
import { chartTheme } from "../../styles/chartTheme";
import { ChartLegend } from "./ChartLegend";

export type ForecastPoint = {
  dateTimestamp: number;
  close?: number; // Historical points use 'close'
  predicted?: number; // Forecast points use 'predicted'
  forecastUpper?: number;
  forecastLower?: number;
  [key: string]: unknown;
};

interface ForecastChartProps {
  historyTail: Array<{ dateTimestamp: number; close: number }>;
  forecast: ForecastPoint[];
}

/**
 * ForecastChart
 * Renders a short historical tail (close) plus forecast continuation (predicted).
 * Separate chart, separate axes, no shared ChartAxes or ForecastLayer.
 */
export const ForecastChart: React.FC<ForecastChartProps> = ({
  historyTail,
  forecast,
}) => {
  const data = useMemo(() => {
    const history = historyTail ?? [];
    const fc = forecast ?? [];
    if (!history.length && !fc.length) return [];

    // Historical points use 'close'; forecast points use 'predicted' or 'close'.
    // Transform forecast points to have both close (for display) and predicted
    const transformedForecast = fc.map((point) => ({
      ...point,
      // Use predicted if available, otherwise use close
      predicted: point.predicted ?? point.close,
      close: point.close ?? point.predicted,
    }));

    return [...history, ...transformedForecast];
  }, [historyTail, forecast]);

  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={chartTheme.margins.default}
      >
        <CartesianGrid
          strokeDasharray={chartTheme.grid.strokeDasharray}
          stroke={chartTheme.grid.stroke}
          strokeOpacity={chartTheme.grid.strokeOpacity}
        />

        <XAxis
          dataKey="dateTimestamp"
          type="number"
          domain={["dataMin", "dataMax"]}
          stroke={chartTheme.axes.stroke}
          tick={chartTheme.axes.tick}
          interval="preserveStartEnd"
          angle={-45}
          textAnchor="end"
          height={80}
          allowDataOverflow={false}
          tickFormatter={(value: number) => {
            if (!value || isNaN(value)) return "";
            const date = new Date(value);
            if (isNaN(date.getTime())) return "";
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }}
        />

        <YAxis
          yAxisId="price"
          orientation="right"
          stroke={chartTheme.axes.stroke}
          tick={chartTheme.axes.tick}
          width={80}
          tickFormatter={(value) => {
            if (isNaN(value) || value === null || value === undefined) return "";
            const formatted =
              value >= 1000
                ? `$${(value / 1000).toFixed(1)}K`
                : value >= 1
                ? `$${value.toFixed(2)}`
                : `$${value.toFixed(4)}`;
            return formatted;
          }}
        />

        <Tooltip
          contentStyle={chartTheme.tooltip}
          labelFormatter={(value) => {
            if (value && !isNaN(value)) {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            }
            return "";
          }}
          formatter={(value: any, name: string) => {
            if (typeof value === "number") {
              return [`$${value.toFixed(2)}`, name];
            }
            return [value, name];
          }}
        />

        <ChartLegend />

        {/* Forecast confidence band (upper/lower bounds) */}
        {forecast.length > 0 && (
          <>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartTheme.colors.forecast} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartTheme.colors.forecast} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            {/* Forecast band area - fills from 0 to upper bound */}
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="forecastUpper"
              stroke="none"
              fill="url(#forecastGradient)"
              connectNulls={true}
              name="Forecast Band"
              isAnimationActive={false}
            />
          </>
        )}

        {/* Historical tail */}
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="close"
          dot={false}
          stroke={chartTheme.lineStyles.price.stroke}
          strokeWidth={chartTheme.lineStyles.price.strokeWidth}
          name="Historical"
          isAnimationActive={false}
        />

        {/* Forecast continuation */}
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="predicted"
          dot={false}
          stroke={chartTheme.lineStyles.forecast.stroke}
          strokeWidth={chartTheme.lineStyles.forecast.strokeWidth}
          strokeDasharray={chartTheme.lineStyles.forecast.strokeDasharray}
          name="Forecast"
          isAnimationActive={false}
        />

        {/* Optional upper bound line */}
        {forecast.length > 0 && (
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="forecastUpper"
            stroke={chartTheme.lineStyles.forecastBound.stroke}
            strokeWidth={chartTheme.lineStyles.forecastBound.strokeWidth}
            strokeDasharray={chartTheme.lineStyles.forecastBound.strokeDasharray}
            strokeOpacity={chartTheme.lineStyles.forecastBound.strokeOpacity}
            dot={false}
            connectNulls={true}
            name="Upper Bound"
            isAnimationActive={false}
          />
        )}

        {/* Optional lower bound line */}
        {forecast.length > 0 && (
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="forecastLower"
            stroke={chartTheme.lineStyles.forecastBound.stroke}
            strokeWidth={chartTheme.lineStyles.forecastBound.strokeWidth}
            strokeDasharray={chartTheme.lineStyles.forecastBound.strokeDasharray}
            strokeOpacity={chartTheme.lineStyles.forecastBound.strokeOpacity}
            dot={false}
            connectNulls={true}
            name="Lower Bound"
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

