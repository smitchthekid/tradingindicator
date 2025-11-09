import { OHLCVData, CalculatedIndicators, IndicatorConfig, TradingSignal, SupportResistance, RiskMetrics } from '../types';

/**
 * Detect support and resistance levels
 */
export function detectSupportResistance(
  data: OHLCVData[],
  lookback: number = 20
): SupportResistance[] {
  const levels: SupportResistance[] = [];
  const pricePoints: Array<{ price: number; type: 'support' | 'resistance'; index: number }> = [];
  
  // Collect local highs and lows
  for (let i = lookback; i < data.length - lookback; i++) {
    const window = data.slice(i - lookback, i + lookback);
    const currentHigh = data[i].high;
    const currentLow = data[i].low;
    
    // Check if current high is a local maximum
    const isLocalHigh = window.every(d => d.high <= currentHigh);
    if (isLocalHigh) {
      pricePoints.push({ price: currentHigh, type: 'resistance', index: i });
    }
    
    // Check if current low is a local minimum
    const isLocalLow = window.every(d => d.low >= currentLow);
    if (isLocalLow) {
      pricePoints.push({ price: currentLow, type: 'support', index: i });
    }
  }
  
  // Group nearby levels
  const tolerance = 0.02; // 2% tolerance
  const grouped: Map<string, { prices: number[]; indices: number[]; type: 'support' | 'resistance' }> = new Map();
  
  pricePoints.forEach(({ price, type, index }) => {
    let found = false;
    for (const [, group] of grouped.entries()) {
      const groupPrice = group.prices[0];
      if (Math.abs(price - groupPrice) / groupPrice < tolerance && group.type === type) {
        group.prices.push(price);
        group.indices.push(index);
        found = true;
        break;
      }
    }
    if (!found) {
      grouped.set(`${type}-${price}`, { prices: [price], indices: [index], type });
    }
  });
  
  // Convert to SupportResistance objects
  grouped.forEach((group) => {
    const avgPrice = group.prices.reduce((a, b) => a + b, 0) / group.prices.length;
    const strength = Math.min(5, Math.floor(group.prices.length / 2) + 1);
    levels.push({
      level: avgPrice,
      type: group.type,
      strength,
      touches: group.prices.length,
    });
  });
  
  return levels.sort((a, b) => b.level - a.level);
}

/**
 * Calculate ATR trailing stop
 * Adapts to volatility and signals trend reversals
 */
function calculateATRTrailingStop(
  data: OHLCVData[],
  indicators: CalculatedIndicators,
  config: IndicatorConfig,
  index: number
): { trailingStop: number; direction: 'UP' | 'DOWN' | 'NEUTRAL' } {
  if (!config.atr.enabled || !indicators.atr || indicators.atr.length <= index) {
    return { trailingStop: data[index].close, direction: 'NEUTRAL' };
  }
  
  const atr = indicators.atr[index];
  const currentPrice = data[index].close;
  const high = data[index].high;
  const low = data[index].low;
  
  if (!atr || isNaN(atr) || atr <= 0) {
    return { trailingStop: currentPrice, direction: 'NEUTRAL' };
  }
  
  // ATR trailing stop: for long positions, stop is high - (ATR * multiplier)
  // For short positions, stop is low + (ATR * multiplier)
  const multiplier = config.riskManagement.atrStopLossMultiplier;
  
  // Determine direction based on price vs trailing stop
  const longTrailingStop = high - (atr * multiplier);
  const shortTrailingStop = low + (atr * multiplier);
  
  // Use the trailing stop that's closer to price (more recent)
  if (currentPrice > longTrailingStop) {
    return { trailingStop: longTrailingStop, direction: 'UP' };
  } else if (currentPrice < shortTrailingStop) {
    return { trailingStop: shortTrailingStop, direction: 'DOWN' };
  } else {
    return { trailingStop: currentPrice, direction: 'NEUTRAL' };
  }
}

/**
 * Detect death cross (EMA crossover)
 * Death cross: shorter EMA crosses below longer EMA (bearish)
 * Golden cross: shorter EMA crosses above longer EMA (bullish)
 */
function detectDeathCross(
  data: OHLCVData[],
  indicators: CalculatedIndicators,
  config: IndicatorConfig,
  index: number
): { isDeathCross: boolean; isGoldenCross: boolean } {
  if (!config.ema.enabled || !indicators.ema || indicators.ema.length <= index) {
    return { isDeathCross: false, isGoldenCross: false };
  }
  
  // Use EMA(20) as shorter and EMA(50) as longer (if available)
  // For now, use current EMA vs price trend
  const ema = indicators.ema[index];
  const currentPrice = data[index].close;
  
  if (!ema || isNaN(ema)) {
    return { isDeathCross: false, isGoldenCross: false };
  }
  
  // Check if price crossed EMA (simplified death/golden cross)
  if (index > 0) {
    const previousPrice = data[index - 1].close;
    const previousEma = indicators.ema[index - 1];
    
    if (previousEma && !isNaN(previousEma)) {
      // Death cross: price was above EMA, now below
      const isDeathCross = previousPrice > previousEma && currentPrice < ema;
      // Golden cross: price was below EMA, now above
      const isGoldenCross = previousPrice < previousEma && currentPrice > ema;
      
      return { isDeathCross, isGoldenCross };
    }
  }
  
  return { isDeathCross: false, isGoldenCross: false };
}

/**
 * Generate trading signals with multi-factor logic
 * BUY: Price crosses above EMA(20) AND stays above lower volatility band AND near support/resistance
 * SELL: Price crosses below EMA OR ATR trailing-stop cross OR death cross with increasing ATR volatility
 * Enforces minimum 1:3 risk-to-reward ratio and 1-2% capital risk per trade
 */
export function generateSignals(
  data: OHLCVData[],
  indicators: CalculatedIndicators,
  config: IndicatorConfig
): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  if (data.length === 0 || !indicators) return signals;
  
  // Need at least 2 data points for comparison
  if (data.length < 2) return signals;
  
  const latestIndex = data.length - 1;
  const previousIndex = latestIndex - 1;
  const latest = data[latestIndex];
  const previous = data[previousIndex];
  
  let buySignal = false;
  let sellSignal = false;
  let reason = '';
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  
  // Multi-factor signal generation
  
  // Factor 1: EMA crossover and position relative to EMA
  let priceCrossedAboveEMA = false;
  let priceStayedAboveEMA = false;
  let priceAboveEMA = false;
  
  if (config.ema.enabled && indicators.ema.length > latestIndex && indicators.ema.length > previousIndex) {
    const currentEma = indicators.ema[latestIndex];
    const previousEma = indicators.ema[previousIndex];
    
    if (currentEma && !isNaN(currentEma) && previousEma && !isNaN(previousEma)) {
      priceAboveEMA = latest.close > currentEma;
      priceStayedAboveEMA = previous.close > previousEma && latest.close > currentEma;
      // Check for crossover: price was below EMA, now above
      priceCrossedAboveEMA = previous.close <= previousEma && latest.close > currentEma;
      
      if (priceAboveEMA) {
        trend = 'BULLISH';
      } else {
        trend = 'BEARISH';
      }
    }
  }
  
  // Factor 2: Volatility bands
  let priceAboveLowerBand = false;
  if (config.volatilityBands.enabled && indicators.lowerBand.length > latestIndex && indicators.lowerBand.length > previousIndex) {
    const lowerBand = indicators.lowerBand[latestIndex];
    const previousLowerBand = indicators.lowerBand[previousIndex];
    if (lowerBand && !isNaN(lowerBand) && previousLowerBand && !isNaN(previousLowerBand)) {
      priceAboveLowerBand = latest.close > lowerBand;
    }
  }
  
  // Factor 3: ATR trailing stop and volatility
  const trailingStop = calculateATRTrailingStop(data, indicators, config, latestIndex);
  const previousTrailingStop = calculateATRTrailingStop(data, indicators, config, previousIndex);
  
  // Check if ATR is increasing (volatility increasing)
  let atrIncreasing = false;
  if (config.atr.enabled && indicators.atr.length > latestIndex && indicators.atr.length > previousIndex) {
    const currentATR = indicators.atr[latestIndex];
    const previousATR = indicators.atr[previousIndex];
    if (currentATR && !isNaN(currentATR) && previousATR && !isNaN(previousATR)) {
      atrIncreasing = currentATR > previousATR;
    }
  }
  
  // Factor 4: Death cross detection
  const { isDeathCross, isGoldenCross } = detectDeathCross(data, indicators, config, latestIndex);
  
  // Factor 5: Support/Resistance levels
  const supportResistance = detectSupportResistance(data);
  const currentPrice = latest.close;
  
  // Check if price is near support (within 2% for buy signals)
  const nearSupport = supportResistance
    .filter(sr => sr.type === 'support')
    .some(sr => Math.abs(currentPrice - sr.level) / currentPrice <= 0.02);
  
  // BUY Signal Logic (refined):
  // 1. Price crosses above EMA(20) OR stays above EMA
  // 2. Price stays above lower volatility band
  // 3. Price near support level (optional but preferred)
  // 4. Minimum 1:3 risk-to-reward ratio must be achievable
  const buyConditions = [
    (priceCrossedAboveEMA || priceStayedAboveEMA),
    priceAboveLowerBand,
    // Support level is preferred but not required
  ];
  
  if (buyConditions.every(Boolean)) {
    // Calculate potential stop loss and target to verify R:R ratio
    let potentialStopLoss = currentPrice;
    let potentialTarget = currentPrice;
    
    if (config.atr.enabled && indicators.atr.length > latestIndex) {
      const atr = indicators.atr[latestIndex];
      if (atr && !isNaN(atr) && atr > 0) {
        potentialStopLoss = currentPrice - (atr * config.riskManagement.atrStopLossMultiplier);
        potentialTarget = currentPrice + (atr * config.riskManagement.atrStopLossMultiplier * 3);
      }
    } else {
      potentialStopLoss = currentPrice * 0.98;
      potentialTarget = currentPrice * 1.06;
    }
    
    const risk = Math.abs(currentPrice - potentialStopLoss);
    const reward = Math.abs(potentialTarget - currentPrice);
    const riskRewardRatio = risk > 0 ? reward / risk : 0;
    
    // Only generate buy signal if R:R >= 1:3
    if (riskRewardRatio >= 3) {
      buySignal = true;
      reason = 'Price crossed/stayed above EMA(20) and above lower volatility band';
      if (isGoldenCross) {
        reason += ' + Golden cross confirmation';
      }
      if (nearSupport) {
        reason += ' + Near support level';
      }
    }
  }
  
  // SELL Signal Logic (refined):
  // 1. Price crosses below EMA(20) with increasing ATR volatility, OR
  // 2. ATR trailing-stop cross, OR
  // 3. Death cross
  let priceCrossedBelowEMA = false;
  if (config.ema.enabled && indicators.ema.length > latestIndex && indicators.ema.length > previousIndex) {
    const currentEma = indicators.ema[latestIndex];
    const previousEma = indicators.ema[previousIndex];
    if (currentEma && !isNaN(currentEma) && previousEma && !isNaN(previousEma)) {
      priceCrossedBelowEMA = previous.close >= previousEma && latest.close < currentEma;
    }
  }
  
  if (priceCrossedBelowEMA && atrIncreasing) {
    sellSignal = true;
    reason = 'Price crossed below EMA with increasing ATR volatility';
  }
  
  if (trailingStop.direction === 'DOWN' && previousTrailingStop.direction !== 'DOWN') {
    sellSignal = true;
    if (reason) {
      reason += ' + ATR trailing stop crossed';
    } else {
      reason = 'ATR trailing stop crossed (trend reversal)';
    }
  }
  
  if (isDeathCross) {
    sellSignal = true;
    if (reason) {
      reason += ' + Death cross';
    } else {
      reason = 'Death cross (EMA crossover)';
    }
    if (atrIncreasing) {
      reason += ' with increasing volatility';
    }
  }
  
  // Additional sell condition: price below EMA and below lower band
  if (!priceAboveEMA && !priceAboveLowerBand && !sellSignal) {
    sellSignal = true;
    reason = 'Price below EMA and below lower volatility band';
  }
  
  // Prevent contradictory signals
  if (buySignal && sellSignal) {
    // Prioritize sell signals (risk management)
    buySignal = false;
    reason = reason.replace(/Price crossed.*?band/, '').trim();
    if (!reason) {
      reason = 'Conflicting signals - prioritizing sell for risk management';
    }
  }
  
  // Generate signal if conditions met
  if (buySignal || sellSignal) {
    const entryPrice = latest.close;
    let stopLoss = entryPrice;
    let target = entryPrice;
    
    // Calculate stop loss and target with ATR
    if (config.atr.enabled && indicators.atr.length > latestIndex) {
      const atr = indicators.atr[latestIndex];
      if (atr && !isNaN(atr) && atr > 0) {
        if (buySignal) {
          stopLoss = entryPrice - (atr * config.riskManagement.atrStopLossMultiplier);
          target = entryPrice + (atr * config.riskManagement.atrStopLossMultiplier * 3); // 1:3 R:R
        } else {
          stopLoss = entryPrice + (atr * config.riskManagement.atrStopLossMultiplier);
          target = entryPrice - (atr * config.riskManagement.atrStopLossMultiplier * 3);
        }
      } else {
        // Fallback: use 2% stop loss if ATR not available
        if (buySignal) {
          stopLoss = entryPrice * 0.98;
          target = entryPrice * 1.06; // 1:3 R:R
        } else {
          stopLoss = entryPrice * 1.02;
          target = entryPrice * 0.94;
        }
      }
    } else {
      // Fallback: use 2% stop loss if ATR not enabled
      if (buySignal) {
        stopLoss = entryPrice * 0.98;
        target = entryPrice * 1.06; // 1:3 R:R
      } else {
        stopLoss = entryPrice * 1.02;
        target = entryPrice * 0.94;
      }
    }
    
    // Enforce 1-2% capital risk per trade
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    
    // Ensure risk percentage is between 1-2%
    const actualRiskPercentage = (riskPerShare / entryPrice) * 100;
    if (actualRiskPercentage < 1) {
      // Adjust stop loss to enforce minimum 1% risk
      if (buySignal) {
        stopLoss = entryPrice * 0.99;
      } else {
        stopLoss = entryPrice * 1.01;
      }
    } else if (actualRiskPercentage > 2) {
      // Adjust stop loss to enforce maximum 2% risk
      if (buySignal) {
        stopLoss = entryPrice * 0.98;
      } else {
        stopLoss = entryPrice * 1.02;
      }
    }
    
    // Recalculate target with adjusted stop loss
    // Enforce minimum 1:3 risk-to-reward ratio
    const adjustedRisk = Math.abs(entryPrice - stopLoss);
    if (buySignal) {
      target = entryPrice + (adjustedRisk * 3); // 1:3 R:R minimum
    } else {
      target = entryPrice - (adjustedRisk * 3);
    }
    
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(target - entryPrice);
    const riskRewardRatio = risk > 0 ? reward / risk : 0;
    
    // Final validation: only generate signal if R:R >= 1:3
    if (riskRewardRatio < 3) {
      // Don't generate signal if R:R is too low
      return signals;
    }
    
    signals.push({
      index: latestIndex,
      date: latest.date,
      type: buySignal ? 'BUY' : 'SELL',
      price: entryPrice,
      stopLoss,
      target,
      riskRewardRatio,
      trend,
      reason,
    });
  }
  
  return signals;
}

/**
 * Calculate risk metrics
 */
export function calculateRiskMetrics(
  data: OHLCVData[],
  indicators: CalculatedIndicators,
  config: IndicatorConfig,
  entryPrice?: number,
  targetPrice?: number
): RiskMetrics {
  const latest = data[data.length - 1];
  const currentPrice = entryPrice || latest.close;
  
  const riskAmount = (config.riskManagement.accountSize * config.riskManagement.riskPercentage) / 100;
  
  let stopLossDistance = 0;
  let stopLossPrice = currentPrice;
  
  if (config.atr.enabled && indicators.atr.length > 0) {
    const atr = indicators.atr[indicators.atr.length - 1];
    stopLossDistance = atr * config.riskManagement.atrStopLossMultiplier;
    stopLossPrice = currentPrice - stopLossDistance; // For long positions
  }
  
  const positionSize = stopLossDistance > 0 ? Math.floor(riskAmount / stopLossDistance) : 0;
  
  // Calculate target based on 1:3 R:R minimum
  const recommendedTarget = currentPrice + (stopLossDistance * 3);
  const actualTarget = targetPrice || recommendedTarget;
  
  const risk = Math.abs(currentPrice - stopLossPrice);
  const reward = Math.abs(actualTarget - currentPrice);
  const riskRewardRatio = risk > 0 ? reward / risk : 0;
  
  return {
    accountSize: config.riskManagement.accountSize,
    riskPercentage: config.riskManagement.riskPercentage,
    riskAmount,
    positionSize,
    stopLossDistance,
    stopLossPrice,
    entryPrice: currentPrice,
    targetPrice: actualTarget,
    riskRewardRatio,
    recommendedTarget,
  };
}

