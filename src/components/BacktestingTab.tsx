import React from 'react';
import './BacktestingTab.css';

export const BacktestingTab: React.FC = () => {
  return (
    <div className="backtesting-tab">
      <h3>Backtesting Results</h3>
      <div className="backtest-info">
        <p>
          Backtesting functionality analyzes historical performance of your strategy.
        </p>
        <div className="sample-results">
          <h4>Sample Strategy Performance</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Win Rate</span>
              <span className="metric-value">58%</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Total Trades</span>
              <span className="metric-value">127</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Avg R:R</span>
              <span className="metric-value">1:2.8</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Profit Factor</span>
              <span className="metric-value">1.45</span>
            </div>
          </div>
          <div className="backtest-note">
            <strong>Note:</strong> These are sample results. Full backtesting requires historical data analysis 
            and will be available in a future update. Always test strategies on paper before risking real capital.
          </div>
        </div>
      </div>
    </div>
  );
};

