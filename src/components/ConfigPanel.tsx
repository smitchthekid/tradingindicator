import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { configAtom, persistConfigAtom, defaultConfig } from '../atoms/config';
import {
  forecastModelAtom,
  forecastEnabledAtom,
  forecastPeriodAtom,
  forecastConfidenceAtom,
  simpleForecastAtom,
  arimaForecastAtom,
  prophetForecastAtom,
  lstmForecastAtom,
  forecastCache,
} from '../atoms/forecast';
import { IndicatorConfig } from '../types';
import { ConfigSection } from './ConfigSection';
import { ApiSettings } from './ApiSettings';
import './ConfigPanel.css';

export const ConfigPanel: React.FC = () => {
  const [config, setConfig] = useAtom(configAtom);
  const [, persistConfig] = useAtom(persistConfigAtom);
  const [showHelp, setShowHelp] = useState(false);
  
  // Forecast atoms for reset
  const [, setForecastModel] = useAtom(forecastModelAtom);
  const [, setForecastEnabled] = useAtom(forecastEnabledAtom);
  const [, setForecastPeriod] = useAtom(forecastPeriodAtom);
  const [, setForecastConfidence] = useAtom(forecastConfidenceAtom);
  const [, setSimpleForecast] = useAtom(simpleForecastAtom);
  const [, setArimaForecast] = useAtom(arimaForecastAtom);
  const [, setProphetForecast] = useAtom(prophetForecastAtom);
  const [, setLstmForecast] = useAtom(lstmForecastAtom);

  const updateConfig = (updates: Partial<IndicatorConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    persistConfig(newConfig);
  };

  const handleReset = () => {
    if (window.confirm('Reset all configurations to default values? This will restore all settings to typical working ranges.')) {
      // Reset main config
      const resetConfig = { ...defaultConfig };
      setConfig(resetConfig);
      persistConfig(resetConfig);
      
      // Reset forecast atoms
      setForecastModel(defaultConfig.forecast.model);
      setForecastEnabled(defaultConfig.forecast.enabled);
      setForecastPeriod(defaultConfig.forecast.forecastPeriod);
      setForecastConfidence(defaultConfig.forecast.confidenceLevel);
      
      // Clear forecast cache
      forecastCache.clear();
      setSimpleForecast(null);
      setArimaForecast(null);
      setProphetForecast(null);
      setLstmForecast(null);
      
      console.log('Configuration reset to defaults');
    }
  };

  return (
    <div className="config-panel">
      <div className="config-header">
        <h2>Configuration</h2>
        <div className="header-actions">
          <label className="pro-mode-toggle">
            <input
              type="checkbox"
              checked={config.proMode}
              onChange={(e) => updateConfig({ proMode: e.target.checked })}
            />
            <span>Pro Mode</span>
          </label>
          <button
            className="reset-button"
            onClick={handleReset}
            aria-label="Reset all configurations"
            title="Reset all settings to default values"
          >
            ↻ Reset
          </button>
          <button
            className="help-button"
            onClick={() => setShowHelp(!showHelp)}
            aria-label="Toggle help"
          >
            {showHelp ? '✕' : '?'}
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="help-overlay">
          <div className="help-content">
            <h3>Parameter Guide</h3>
            <div className="help-section">
              <h4>EMA (Exponential Moving Average)</h4>
              <p>Smooths price data to identify trends. Lower periods react faster to price changes.</p>
            </div>
            <div className="help-section">
              <h4>ATR (Average True Range)</h4>
              <p>Measures market volatility. Used to set stop-losses and position sizes based on volatility.</p>
            </div>
            <div className="help-section">
              <h4>Volatility Bands</h4>
              <p>Shows price channels based on standard deviation. Prices outside bands may indicate overbought/oversold conditions.</p>
            </div>
            <div className="help-section">
              <h4>Risk Management</h4>
              <p>Account size and risk percentage determine position sizing. ATR multiplier sets stop-loss distance from entry.</p>
            </div>
            <button onClick={() => setShowHelp(false)} className="close-help">
              Close
            </button>
          </div>
        </div>
      )}

      <ConfigSection
        title="Price Forecasting"
        config={config.forecast}
        onUpdate={(forecast) => updateConfig({ forecast })}
        description="AI-powered price predictions using statistical models. Simple MA uses moving averages. ARIMA captures trends and mean reversion. Prophet detects seasonality. LSTM learns complex patterns. Use forecasts as guidance, not guarantees. Confidence intervals show prediction uncertainty - wider bands = less confidence."
        fields={[
          { key: 'enabled', label: 'Enable Forecasting', type: 'checkbox', tooltip: 'Generate price predictions using all models. Each model will be displayed in its own chart.' },
          ...(config.forecast.enabled ? [
            { key: 'forecastPeriod', label: 'Forecast Period (days)', type: 'number' as const, min: 1, max: 90, step: 1, tooltip: 'Number of days (time periods) to forecast into the future. For daily data, this is the number of days ahead to predict' },
            { key: 'confidenceLevel', label: 'Confidence Level', type: 'number' as const, min: 0.5, max: 0.99, step: 0.01, tooltip: 'Confidence interval for predictions (0.95 = 95%)' },
          ] : []),
        ]}
      />

      <ApiSettings config={config} updateConfig={updateConfig} />

      <ConfigSection
        title="EMA Settings"
        config={config.ema}
        onUpdate={(ema) => updateConfig({ ema })}
        description="Exponential Moving Average (EMA) smooths price data to identify trends. Period = number of time intervals (days for daily charts) used in calculation. Lower periods (e.g., 10-20) react faster to price changes, helping you catch short-term moves. Higher periods (e.g., 50-200) show longer-term trends. EMA crossovers with price can signal entry/exit points."
        fields={[
          { key: 'enabled', label: 'Enable EMA', type: 'checkbox', tooltip: 'Exponential Moving Average smooths price data to identify trends' },
          { key: 'period', label: 'Period', type: 'number' as const, min: 1, max: 200, tooltip: 'Number of time periods (days for daily data) to calculate EMA. Lower values react faster to price changes' },
          ...(config.proMode ? [{ key: 'color', label: 'Color', type: 'color' as const, tooltip: 'Color of the EMA line on the chart' }] : []),
        ]}
      />

      <ConfigSection
        title="ATR Settings"
        config={config.atr}
        onUpdate={(atr) => updateConfig({ atr })}
        description="Average True Range (ATR) measures market volatility. Period = number of time intervals (days for daily charts) used to calculate average volatility. Higher ATR = more volatility. Use ATR to set stop-losses: place stops 2x ATR away from entry to avoid getting stopped out by normal price swings. ATR also helps size positions - volatile markets require smaller positions."
        fields={[
          { key: 'enabled', label: 'Enable ATR', type: 'checkbox' },
          { key: 'period', label: 'Period', type: 'number' as const, min: 1, max: 200, tooltip: 'Number of time periods (days for daily data) to calculate average volatility' },
          ...(config.proMode ? [
            { key: 'multiplier', label: 'Multiplier', type: 'number' as const, min: 0.1, max: 10, step: 0.1, tooltip: 'Multiplier for ATR-based stop loss distance (recommended: 2x ATR)' },
            { key: 'color', label: 'Color', type: 'color' as const },
          ] : []),
        ]}
      />

      <ConfigSection
        title="Volatility Bands"
        config={config.volatilityBands}
        onUpdate={(volatilityBands) => updateConfig({ volatilityBands })}
        description="Volatility Bands show price channels based on standard deviation. Period = number of time intervals (days for daily charts) used to calculate the bands. When price touches the upper band, it may be overbought (consider selling). When price touches the lower band, it may be oversold (consider buying). The multiplier controls band width - higher = wider bands, more conservative signals."
        fields={[
          { key: 'enabled', label: 'Enable Bands', type: 'checkbox' },
          ...(config.proMode ? [
            { key: 'period', label: 'Period', type: 'number' as const, min: 1, max: 200, tooltip: 'Number of time periods (days for daily data) to calculate volatility bands' },
            { key: 'multiplier', label: 'Multiplier', type: 'number' as const, min: 0.1, max: 10, step: 0.1, tooltip: 'Standard deviation multiplier - higher values create wider bands' },
            { key: 'color', label: 'Color', type: 'color' as const },
          ] : []),
        ]}
      />

      <ConfigSection
        title="Risk Management"
        config={config.riskManagement}
        onUpdate={(riskManagement) => updateConfig({ riskManagement })}
        description="Protect your capital! Risk only 1-2% of your account per trade. With a $5,000 account and 2% risk, you risk $100 per trade. The ATR multiplier sets stop-loss distance - 2x ATR gives price room to breathe. Proper risk management is the #1 factor in long-term trading success."
        fields={[
          { key: 'accountSize', label: 'Account Size ($)', type: 'number' as const, min: 0, step: 100, tooltip: 'Total trading account balance' },
          { key: 'riskPercentage', label: 'Risk Percentage (%)', type: 'number' as const, min: 0, max: 100, step: 0.1, tooltip: 'Percentage of account to risk per trade (recommended: 1-2%)' },
          ...(config.proMode ? [
            { key: 'atrStopLossMultiplier', label: 'ATR Stop-Loss Multiplier', type: 'number' as const, min: 0.1, max: 10, step: 0.1, tooltip: 'Multiplier for ATR-based stop loss distance (recommended: 2x ATR)' },
          ] : []),
        ]}
      />
    </div>
  );
};

