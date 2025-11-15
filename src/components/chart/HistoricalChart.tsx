/**
 * Historical Chart Component
 * Renders historical price + indicators only.
 * No forecast data, no ForecastLayer, no shared ChartAxes.
 */

import React, { useMemo } from "react";
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Line,
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

  // Debug: Log data structure
  if (import.meta.env.DEV && data.length > 0) {
    const samplePrices = data.slice(0, 5).map((p: any) => p.close).filter((p: any) => p && !isNaN(p));
    console.log('[HistoricalChart] Data received:', {
      length: data.length,
      firstPoint: data[0],
      samplePrices,
      hasClose: data[0]?.close !== undefined,
      hasDateTimestamp: data[0]?.dateTimestamp !== undefined,
      yDomain,
      yDomainValid: yDomain && Array.isArray(yDomain) && yDomain.length === 2 && !isNaN(yDomain[0]) && !isNaN(yDomain[1]),
    });
  }

  // Prepare chartData for layers that need it (not for Recharts data prop)
  // Ensure fullDate exists for ReferenceLinesLayer
  const chartData = data.map((point) => ({
    ...point,
    fullDate: point.fullDate || new Date(point.dateTimestamp).toISOString().split('T')[0],
  })) as Array<{ atr?: number; dateTimestamp: number; fullDate: string }>;

  // Validate data has required fields
  const validData = data.filter((point: any) => {
    const isValid = point && 
      point.dateTimestamp && 
      !isNaN(point.dateTimestamp) &&
      point.close !== undefined &&
      point.close !== null &&
      !isNaN(point.close) && 
      point.close > 0;
    
    if (import.meta.env.DEV && !isValid && data.length > 0) {
      console.warn('[HistoricalChart] Filtered out invalid point:', {
        point,
        hasDateTimestamp: !!point?.dateTimestamp,
        dateTimestampValid: point?.dateTimestamp && !isNaN(point.dateTimestamp),
        hasClose: point?.close !== undefined,
        closeValid: point?.close !== null && !isNaN(point.close) && point.close > 0,
      });
    }
    
    return isValid;
  });

  if (validData.length === 0) {
    if (import.meta.env.DEV) {
      console.error('[HistoricalChart] No valid data points after filtering. Original data:', {
        originalLength: data.length,
        samplePoint: data[0],
        allKeys: data[0] ? Object.keys(data[0]) : [],
      });
    }
    return null;
  }
  
  if (import.meta.env.DEV && validData.length < data.length) {
    console.warn(`[HistoricalChart] Filtered ${data.length - validData.length} invalid points from ${data.length} total`);
  }

  // Calculate Y-axis domain from actual data if passed domain is invalid
  const calculatedYDomain = useMemo(() => {
    // Check if passed domain is valid
    if (
      yDomain && 
      Array.isArray(yDomain) && 
      yDomain.length === 2 && 
      typeof yDomain[0] === 'number' &&
      typeof yDomain[1] === 'number' &&
      !isNaN(yDomain[0]) && 
      !isNaN(yDomain[1]) && 
      yDomain[0] < yDomain[1] &&
      yDomain[0] >= 0
    ) {
      if (import.meta.env.DEV) {
        console.log('[HistoricalChart] Using passed Y-domain:', yDomain);
      }
      return yDomain as [number, number];
    }
    
    // Fallback: calculate from actual data
    const prices = validData.map((p: any) => p.close).filter((p: any) => p && !isNaN(p) && p > 0);
    if (prices.length === 0) {
      if (import.meta.env.DEV) {
        console.warn('[HistoricalChart] No valid prices, using auto domain');
      }
      return ['auto', 'auto'] as [string, string];
    }
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice <= 0 || maxPrice <= 0 || isNaN(minPrice) || isNaN(maxPrice) || minPrice >= maxPrice) {
      if (import.meta.env.DEV) {
        console.warn('[HistoricalChart] Invalid price range, using auto domain', { minPrice, maxPrice });
      }
      return ['auto', 'auto'] as [string, string];
    }
    
    const padding = (maxPrice - minPrice) * 0.1;
    
    const domain: [number, number] = [
      Math.max(0, minPrice - padding),
      maxPrice + padding
    ];
    
    // Final validation
    if (domain[0] >= domain[1] || isNaN(domain[0]) || isNaN(domain[1]) || domain[0] < 0) {
      if (import.meta.env.DEV) {
        console.warn('[HistoricalChart] Invalid calculated domain, using auto', domain);
      }
      return ['auto', 'auto'] as [string, string];
    }
    
    if (import.meta.env.DEV) {
      console.log('[HistoricalChart] Calculated Y-domain from data:', domain, 'from', prices.length, 'prices');
    }
    
    return domain;
  }, [yDomain, validData]);

  // Final diagnostic logging
  if (import.meta.env.DEV && validData.length > 0) {
    const sampleData = validData.slice(0, 3);
    const xRange = [Math.min(...validData.map((p: any) => p.dateTimestamp)), Math.max(...validData.map((p: any) => p.dateTimestamp))];
    const yRange = [Math.min(...validData.map((p: any) => p.close)), Math.max(...validData.map((p: any) => p.close))];
    const hasClose = validData.every((p: any) => p.close !== undefined && !isNaN(p.close));
    const hasVolume = validData.some((p: any) => p.volume !== undefined);
    console.log('[HistoricalChart] Rendering with:', {
      dataPoints: validData.length,
      sampleData,
      xRange,
      yRange,
      calculatedYDomain,
      domainType: typeof calculatedYDomain[0],
      hasClose,
      hasVolume,
      hasPriceLayer: true,
      hasVolumeLayer: true,
      firstPointKeys: Object.keys(validData[0] || {}),
    });
  }

  // Ensure domain is always valid for Recharts
  const finalDomain = useMemo(() => {
    if (Array.isArray(calculatedYDomain) && calculatedYDomain.length === 2) {
      // If it's ['auto', 'auto'], return as-is (Recharts handles this)
      if (calculatedYDomain[0] === 'auto' && calculatedYDomain[1] === 'auto') {
        return calculatedYDomain as [string, string];
      }
      // If it's numbers, ensure they're valid
      if (typeof calculatedYDomain[0] === 'number' && typeof calculatedYDomain[1] === 'number') {
        if (!isNaN(calculatedYDomain[0]) && !isNaN(calculatedYDomain[1]) && calculatedYDomain[0] < calculatedYDomain[1]) {
          return calculatedYDomain as [number, number];
        }
      }
    }
    // Fallback to auto
    return ['auto', 'auto'] as [string, string];
  }, [calculatedYDomain]);

  if (import.meta.env.DEV) {
    console.log('[HistoricalChart] Final domain:', finalDomain, 'Type:', typeof finalDomain[0]);
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={validData}
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
          scale="linear"
          stroke={chartTheme.axes.stroke}
          tick={chartTheme.axes.tick}
          interval="preserveStartEnd"
          angle={-45}
          textAnchor="end"
          height={80}
          allowDataOverflow={true}
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
          orientation="left"
          stroke={chartTheme.axes.stroke}
          tick={chartTheme.axes.tick}
          domain={finalDomain}
          allowDataOverflow={true}
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
            domain={
              atrDomain && 
              Array.isArray(atrDomain) && 
              atrDomain.length === 2 && 
              !isNaN(atrDomain[0]) && 
              !isNaN(atrDomain[1]) && 
              atrDomain[0] < atrDomain[1]
                ? atrDomain 
                : ['auto', 'auto']
            }
            allowDataOverflow={true}
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
          domain={
            volumeDomain && 
            Array.isArray(volumeDomain) && 
            volumeDomain.length === 2 && 
            !isNaN(volumeDomain[0]) && 
            !isNaN(volumeDomain[1]) && 
            volumeDomain[0] < volumeDomain[1]
              ? volumeDomain 
              : ['auto', 'auto']
          }
          allowDataOverflow={true}
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
        {/* Test: Always render price line to verify Recharts is working */}
        <PriceLayer />
        
        {/* Debug: Test with a simple hardcoded line to verify Recharts rendering */}
        {import.meta.env.DEV && validData.length > 0 && (
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="close"
            stroke="#FF0000"
            strokeWidth={3}
            name="DEBUG TEST LINE"
            dot={false}
            connectNulls={true}
            isAnimationActive={false}
            strokeOpacity={1}
          />
        )}

        {atrEnabled && <ATRLayer atrColor={atrColor} />}

        <VolumeLayer allChartData={validData} />

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

