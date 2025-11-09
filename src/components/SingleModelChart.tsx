import React, { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { ForecastResult } from '../types/forecast';
import { IndicatorConfig, OHLCVData, CalculatedIndicators, TradingSignal } from '../types';

interface SingleModelChartProps {
  modelName: string;
  modelLabel: string;
  forecast: ForecastResult | null;
  chartData: any[];
  forecastData: any[];
  fullForecastData: any[];
  config: IndicatorConfig;
  indicators: CalculatedIndicators | null;
  signals: TradingSignal[];
  marketData: OHLCVData[];
  todayTimestamp: number;
  yDomain: [number, number];
}

export const SingleModelChart: React.FC<SingleModelChartProps> = ({
  modelName,
  modelLabel,
  forecast,
  chartData,
  forecastData,
  fullForecastData,
  config,
  indicators,
  signals,
  marketData,
  todayTimestamp,
  yDomain,
}) => {
  const allChartData = useMemo(() => {
    const dataMap = new Map<number, any>();
    chartData.forEach(point => {
      if (point.dateTimestamp && !isNaN(point.dateTimestamp)) {
        dataMap.set(point.dateTimestamp, point);
      }
    });
    forecastData.forEach(point => {
      if (point.dateTimestamp && !isNaN(point.dateTimestamp)) {
        dataMap.set(point.dateTimestamp, point);
      }
    });
    return Array.from(dataMap.values()).sort((a, b) => a.dateTimestamp - b.dateTimestamp);
  }, [chartData, forecastData]);

  return (
    <div className="single-model-chart">
      <div className="chart-header-small">
        <h3>{modelLabel}</h3>
        {forecast && (
          <div className="forecast-badge">
            <span className={`direction-badge direction-${forecast.direction.toLowerCase()}`}>
              {forecast.direction}
            </span>
          </div>
        )}
      </div>
      <div className="chart-container-small">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={allChartData} 
            margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
            <XAxis
              dataKey="dateTimestamp"
              type="number"
              scale="time"
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={60}
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => {
                if (!value || isNaN(value)) return '';
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              domain={yDomain}
              allowDataOverflow={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '6px',
                color: '#F1F5F9',
                padding: '0.5rem',
                fontSize: '0.75rem',
              }}
              labelFormatter={(value) => {
                if (value && !isNaN(value)) {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }
                return '';
              }}
              formatter={(value: any, name: string, props: any) => {
                // Check if this is a signal point and show enhanced tooltip
                if (props && props.payload && props.payload.signalType) {
                  const signal = signals.find(s => {
                    const marketIdx = marketData.findIndex(m => m.date === props.payload.fullDate);
                    return marketIdx === s.index;
                  });
                  if (signal) {
                    return [
                      `${signal.type} Signal\nEntry: $${signal.price.toFixed(2)}\nStop: $${signal.stopLoss.toFixed(2)}\nTarget: $${signal.target.toFixed(2)}\nR:R ${signal.riskRewardRatio.toFixed(2)}:1`,
                      name
                    ];
                  }
                }
                if (typeof value === 'number') {
                  return [`$${value.toFixed(2)}`, name];
                }
                return [value, name];
              }}
            />
            <Legend 
              wrapperStyle={{ color: '#CBD5E1', fontSize: '0.75rem', paddingTop: '0.5rem' }}
              iconType="line"
            />
            
            {/* Layer 1: Historical price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#F1F5F9"
              strokeWidth={2}
              name="Price"
              dot={false}
              connectNulls={false}
              data={chartData}
              isAnimationActive={false}
            />
            
            {/* Layer 2: EMA */}
            {config.ema.enabled && indicators && (
              <Line
                type="monotone"
                dataKey="ema"
                stroke="#14B8A6"
                strokeWidth={1.5}
                name={`EMA(${config.ema.period})`}
                dot={false}
                isAnimationActive={false}
              />
            )}
            
            {/* Layer 3: Forecast with confidence intervals */}
            {forecast && fullForecastData.length > 0 && (
              <>
                <defs>
                  <linearGradient id={`forecastGradient-${modelName}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="forecastUpper"
                  stroke="none"
                  fill={`url(#forecastGradient-${modelName})`}
                  data={fullForecastData}
                  connectNulls={true}
                  name={`${(forecast.confidence * 100).toFixed(0)}% CI`}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  name="Forecast"
                  dot={false}
                  data={fullForecastData}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecastUpper"
                  stroke="#F59E0B"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                  dot={false}
                  data={fullForecastData}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecastLower"
                  stroke="#F59E0B"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                  dot={false}
                  data={fullForecastData}
                  connectNulls={true}
                  isAnimationActive={false}
                />
              </>
            )}
            
            {/* "Today" marker */}
            {chartData.length > 0 && (
              <ReferenceLine
                x={todayTimestamp}
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="8 4"
                strokeOpacity={0.6}
              />
            )}
            
            {/* Signal markers - aligned with exact candles, closer to price line */}
            {signals.map((signal, idx) => {
              const signalDataPoint = chartData.find(p => {
                const marketIdx = marketData.findIndex(m => m.date === p.fullDate);
                return marketIdx === signal.index;
              });
              if (!signalDataPoint || !signalDataPoint.dateTimestamp) return null;
              
              const isBuy = signal.type === 'BUY';
              const color = isBuy ? '#10B981' : '#EF4444';
              const signalPrice = signal.price;
              
              return (
                <React.Fragment key={`signal-${modelName}-${idx}`}>
                  {/* Vertical line at signal point */}
                  <ReferenceLine
                    x={signalDataPoint.dateTimestamp}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    strokeOpacity={0.6}
                  />
                  {/* Signal marker on price line */}
                  <ReferenceLine
                    x={signalDataPoint.dateTimestamp}
                    y={signalPrice}
                    stroke={color}
                    strokeWidth={0}
                    label={{
                      value: isBuy ? '▲' : '▼',
                      position: isBuy ? 'bottom' : 'top',
                      fill: color,
                      fontSize: 14,
                      fontWeight: 'bold',
                      offset: isBuy ? 6 : -6,
                    }}
                  />
                </React.Fragment>
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

