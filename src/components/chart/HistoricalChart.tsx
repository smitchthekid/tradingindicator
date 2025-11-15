/**
 * Historical Chart Component
 * Renders historical price + indicators only.
 * No forecast data, no ForecastLayer, no shared ChartAxes.
 */

import React from "react";
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { chartTheme } from "../../styles/chartTheme";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";
import { ATRBackgroundLayer } from "./ATRBackgroundLayer";
import { PriceLayer } from "./PriceLayer";
import { VolumeLayer } from "./VolumeLayer";
import { EMALayer } from "./EMALayer";
import { ATRLayer } from "./ATRLayer";
import { VolatilityBandsLayer } from "./VolatilityBandsLayer";
import { ReferenceLinesLayer } from "./ReferenceLinesLayer";
import { TradingSignal, SupportResistance, OHLCVData } from "../../types";

export type HistoricalPoint = {
  dateTimestamp: number;
  close: number;
  volume?: number;
  ema?: number;
  atr?: number;
  upperBand?: number;
  lowerBand?: number;
  isUpDay?: boolean;
  fullDate?: string;
  [key: string]: unknown;
};

interface HistoricalChartProps {
  data: HistoricalPoint[];
  // Configuration props
  emaEnabled: boolean;
  emaPeriod: number;
  volatilityBandsEnabled: boolean;
  atrEnabled: boolean;
  atrColor?: string;
  // Domain calculations
  yDomain: [number, number];
  atrDomain: [number, number];
  volumeDomain: [number, number];
  atrThreshold: number | null;
  // Reference lines props
  todayTimestamp: number;
  signals: TradingSignal[];
  marketData: OHLCVData[];
  supportResistance: SupportResistance[];
  latestATRStopLoss?: number;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  emaEnabled,
  emaPeriod,
  volatilityBandsEnabled,
  atrEnabled,
  atrColor,
  yDomain,
  atrDomain,
  volumeDomain,
  atrThreshold,
  todayTimestamp,
  signals,
  marketData,
  supportResistance,
  latestATRStopLoss,
}) => {
  if (!data || data.length === 0) return null;

  // Prepare chartData for layers that need it (not for Recharts data prop)
  // Ensure fullDate exists for ReferenceLinesLayer
  const chartData = data.map((point) => ({
    ...point,
    fullDate: point.fullDate || new Date(point.dateTimestamp).toISOString().split('T')[0],
  })) as Array<{ atr?: number; dateTimestamp: number; fullDate: string }>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={atrEnabled ? chartTheme.margins.withATR : chartTheme.margins.default}
      >
        <CartesianGrid
          strokeDasharray={chartTheme.grid.strokeDasharray}
          stroke={chartTheme.grid.stroke}
          strokeOpacity={chartTheme.grid.strokeOpacity}
        />

        {/* X-axis: numeric timestamps; no scale="time" */}
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

        {/* Y-axes: IDs must match layer props */}
        <YAxis
          yAxisId="left"
          stroke={chartTheme.axes.stroke}
          tick={chartTheme.axes.tick}
          domain={yDomain}
          allowDataOverflow={false}
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

        {atrEnabled && (
          <YAxis
            yAxisId="atr"
            orientation="right"
            stroke={atrColor || chartTheme.colors.atr}
            tick={{ fill: atrColor || chartTheme.colors.atr, fontSize: 10 }}
            domain={atrDomain}
            width={60}
            tickFormatter={(value) => {
              if (isNaN(value) || value === null || value === undefined) return "";
              return value.toFixed(2);
            }}
            label={{
              value: "ATR",
              angle: -90,
              position: "insideRight",
              style: { textAnchor: "middle", fill: atrColor || chartTheme.colors.atr },
            }}
          />
        )}

        <YAxis
          yAxisId="volume"
          orientation="right"
          stroke={chartTheme.colors.text}
          tick={{ fill: chartTheme.colors.text, fontSize: 9 }}
          domain={volumeDomain}
          width={50}
          tickFormatter={(value) => {
            if (isNaN(value) || value === null || value === undefined) return "";
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value.toString();
          }}
          label={{
            value: "Volume",
            angle: -90,
            position: "insideRight",
            style: { textAnchor: "middle", fill: chartTheme.colors.text },
          }}
        />

        <ChartTooltip signals={signals} marketData={marketData} />
        <ChartLegend />

        {/* Background / overlays */}
        {atrEnabled && (
          <ATRBackgroundLayer
            chartData={chartData}
            atrThreshold={atrThreshold}
            yDomain={yDomain}
          />
        )}

        {/* Historical layers – no data={...} props */}
        <PriceLayer />

        {atrEnabled && <ATRLayer atrColor={atrColor} />}

        <VolumeLayer allChartData={data} />

        {emaEnabled && <EMALayer emaPeriod={emaPeriod} />}

        {volatilityBandsEnabled && <VolatilityBandsLayer />}

        <ReferenceLinesLayer
          todayTimestamp={todayTimestamp}
          signals={signals}
          chartData={chartData}
          marketData={marketData}
          supportResistance={supportResistance}
          latestATRStopLoss={latestATRStopLoss}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

