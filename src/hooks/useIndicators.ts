/**
 * Custom hook for indicators, signals, and risk metrics
 * Centralizes calculation logic and state management
 */

import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { indicatorsAtom } from '../atoms/data';
import { calculateIndicators } from '../utils/calculations';
import { generateSignals, detectSupportResistance, calculateRiskMetrics } from '../utils/signals';
import { logger } from '../utils/logger';
import { OHLCVData, TradingSignal, SupportResistance, RiskMetrics, IndicatorConfig } from '../types';

export function useIndicators(
  marketData: OHLCVData[],
  config: IndicatorConfig
) {
  const [indicators, setIndicators] = useAtom(indicatorsAtom);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [supportResistance, setSupportResistance] = useState<SupportResistance[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  
  // Keep last known good values to prevent flickering
  const lastValidIndicatorsRef = useRef(indicators);
  const lastValidSignalsRef = useRef<TradingSignal[]>([]);
  const lastValidRiskMetricsRef = useRef<RiskMetrics | null>(null);
  
  useEffect(() => {
    if (marketData.length === 0) {
      return;
    }
    
    try {
      const calculated = calculateIndicators(marketData, config);
      
      // Only update if we got valid indicators with data
      if (calculated && calculated.ema && Array.isArray(calculated.ema) && calculated.ema.length > 0) {
        setIndicators(calculated);
        lastValidIndicatorsRef.current = calculated;
        
        // Generate signals
        const newSignals = generateSignals(marketData, calculated, config);
        setSignals(newSignals);
        lastValidSignalsRef.current = newSignals;
        
        // Calculate risk metrics
        const latestSignal = newSignals.length > 0 ? newSignals[newSignals.length - 1] : null;
        const metrics = calculateRiskMetrics(
          marketData,
          calculated,
          config,
          latestSignal?.price,
          latestSignal?.target
        );
        setRiskMetrics(metrics);
        lastValidRiskMetricsRef.current = metrics;
      }
      
      // Detect support/resistance (doesn't depend on indicators)
      const sr = detectSupportResistance(marketData);
      setSupportResistance(sr);
    } catch (error) {
      logger.error('Error calculating indicators:', error);
      // Retain last known good values on error
      if (lastValidIndicatorsRef.current) {
        setIndicators(lastValidIndicatorsRef.current);
      }
      if (lastValidSignalsRef.current.length > 0) {
        setSignals(lastValidSignalsRef.current);
      }
      if (lastValidRiskMetricsRef.current) {
        setRiskMetrics(lastValidRiskMetricsRef.current);
      }
    }
  }, [
    marketData,
    config.ema.enabled,
    config.ema.period,
    config.ema.color,
    config.atr.enabled,
    config.atr.period,
    config.atr.multiplier,
    config.atr.color,
    config.volatilityBands.enabled,
    config.volatilityBands.period,
    config.volatilityBands.multiplier,
    config.volatilityBands.color,
    config.riskManagement.accountSize,
    config.riskManagement.riskPercentage,
    config.riskManagement.atrStopLossMultiplier,
    // Note: setIndicators is stable from useAtom, but included for completeness
    setIndicators,
  ]);
  
  return {
    indicators,
    signals,
    supportResistance,
    riskMetrics,
  };
}

