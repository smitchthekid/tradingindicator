import React from 'react';
import { IndicatorConfig } from '../types';
import './ApiSettings.css';

interface ApiSettingsProps {
  config: IndicatorConfig;
  updateConfig: (updates: Partial<IndicatorConfig>) => void;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({ config, updateConfig }) => {
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
            placeholder="AAPL or BTC"
          />
          <small className="field-hint">
            For stocks: AAPL, MSFT, TSLA. For crypto: BTC, ETH, SOL (use BTC, not BTC-USD)
            <br />
            <strong>Note:</strong> For cryptocurrency, Alpha Vantage works better than EODHD (which may require premium).
          </small>
        </div>
        <div className="field">
          <label htmlFor="apiProvider">Provider</label>
          <select
            id="apiProvider"
            value={config.apiProvider}
            onChange={(e) => updateConfig({ apiProvider: e.target.value as 'alphavantage' | 'eodhd' })}
          >
            <option value="alphavantage">Alpha Vantage</option>
            <option value="eodhd">EODHD</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="apiKey">API Key</label>
          <input
            id="apiKey"
            type="password"
            value={config.apiKey}
            onChange={(e) => updateConfig({ apiKey: e.target.value })}
            placeholder="Enter your API key"
          />
          <small className="field-hint">
            Get your API key from{' '}
            <a
              href="https://www.alphavantage.co/support/#api-key"
              target="_blank"
              rel="noopener noreferrer"
            >
              Alpha Vantage
            </a>
            {' '}or{' '}
            <a
              href="https://eodhistoricaldata.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              EODHD
            </a>
          </small>
          <div className="api-limit-info">
            <strong>💡 Token Optimization:</strong> Data is cached for 5 minutes. Use the Refresh button to update. 
            This reduces API calls and helps stay within rate limits.
          </div>
        </div>
      </div>
    </div>
  );
};

