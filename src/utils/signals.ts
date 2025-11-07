import { OHLCVData, CalculatedIndicators, IndicatorConfig, TradingSignal, SupportResistance } from '../types';

/**
 * Detect support and resistance levels
 */
export function detectSupportResistance(
  data: OHLCVData[],
  lookback: number = 20
): SupportResistance[] {
  const levels: SupportResistance[] = [];
  const pricePoints: number[] = [];
  
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
    for (const [key, group] of grouped.entries()) {
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
  grouped.forEach((group, key) => {
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
 * Generate trading signals based on indicator conditions
 */
export function generateSignals(
  data: OHLCVData[],
  indicators: CalculatedIndicators,
  config: IndicatorConfig
): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  if (data.length === 0 || !indicators) return signals;
  
  const latestIndex = data.length - 1;
  if (latestIndex < 0) return signals;
  
  const latest = data[latestIndex];
  
  // Only generate signal for the latest bar
  let buySignal = false;
  let sellSignal = false;
  let reason = '';
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  
  // Buy conditions - need multiple confirmations
  let buyConditions = 0;
  if (config.ema.enabled && indicators.ema.length > latestIndex) {
    const ema = indicators.ema[latestIndex];
    if (ema && !isNaN(ema) && latest.close > ema) {
      buyConditions++;
      trend = 'BULLISH';
      reason = 'Price above EMA';
    }
  }
  
  if (config.volatilityBands.enabled && indicators.lowerBand.length > latestIndex) {
    const lowerBand = indicators.lowerBand[latestIndex];
    if (lowerBand && !isNaN(lowerBand) && latest.close <= lowerBand * 1.01) {
      buyConditions++;
      if (trend === 'NEUTRAL') {
        trend = 'BULLISH';
        reason = 'Price at lower volatility band (oversold)';
      } else {
        reason += ' + Lower band touch';
      }
    }
  }
  
  // Sell conditions - need multiple confirmations
  let sellConditions = 0;
  if (config.ema.enabled && indicators.ema.length > latestIndex) {
    const ema = indicators.ema[latestIndex];
    if (ema && !isNaN(ema) && latest.close < ema) {
      sellConditions++;
      trend = 'BEARISH';
      reason = 'Price below EMA';
    }
  }
  
  if (config.volatilityBands.enabled && indicators.upperBand.length > latestIndex) {
    const upperBand = indicators.upperBand[latestIndex];
    if (upperBand && !isNaN(upperBand) && latest.close >= upperBand * 0.99) {
      sellConditions++;
      if (trend === 'NEUTRAL') {
        trend = 'BEARISH';
        reason = 'Price at upper volatility band (overbought)';
      } else {
        reason += ' + Upper band touch';
      }
    }
  }
  
  // Generate signal if at least one condition is met
  buySignal = buyConditions > 0;
  sellSignal = sellConditions > 0;
  
  // Generate signal if conditions met
  if (buySignal || sellSignal) {
    const entryPrice = latest.close;
    let stopLoss = entryPrice;
    let target = entryPrice;
    
    // Calculate stop loss and target
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
    
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(target - entryPrice);
    const riskRewardRatio = risk > 0 ? reward / risk : 0;
    
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

