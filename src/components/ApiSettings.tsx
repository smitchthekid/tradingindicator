import React from 'react';
import { useAtom } from 'jotai';
import { IndicatorConfig } from '../types';
import { refreshTriggerAtom } from '../atoms/data';
import './ApiSettings.css';

interface ApiSettingsProps {
  config: IndicatorConfig;
  updateConfig: (updates: Partial<IndicatorConfig>) => void;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({ config, updateConfig }) => {
  const [, setRefreshTrigger] = useAtom(refreshTriggerAtom);

  const handleRefresh = () => {
    if (!config.symbol) {
      alert('Please enter a symbol first');
      return;
    }
    // Trigger refresh by updating the trigger atom
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="api-settings">
      <h3 className="section-title">API Settings</h3>
      <div className="section-fields">
        <div className="field">
          <label htmlFor="symbol">Symbol</label>
          <input
            id="symbol"
            type="text"
            value={config.symbol}
            onChange={(e) => updateConfig({ symbol: e.target.value.toUpperCase() })}
            placeholder="AAPL or BTC-USD"
          />
          <small className="field-hint">
            For stocks: AAPL, MSFT, TSLA. For crypto: BTC-USD, ETH-USD, SOL-USD (you can also enter BTC and it will be converted to BTC-USD automatically)
          </small>
        </div>
        <div className="field">
          <small className="field-hint" style={{ color: 'var(--accent-green)', marginTop: '0.25rem' }}>
            ✅ Using Yahoo Finance - Free, no API key required. Data is cached for 24 hours to optimize performance.
          </small>
        </div>
        <div className="field refresh-button-container">
          <button
            type="button"
            className="refresh-button"
            onClick={handleRefresh}
            disabled={!config.symbol}
            aria-label="Refresh market data"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

