import React from 'react';
import { TradingSignal, RiskMetrics, SupportResistance } from '../types';
import './SignalsPanel.css';

interface SignalsPanelProps {
  signals: TradingSignal[];
  riskMetrics: RiskMetrics | null;
  supportResistance: SupportResistance[];
}

export const SignalsPanel: React.FC<SignalsPanelProps> = ({
  signals,
  riskMetrics,
  supportResistance,
}) => {
  const latestSignal = signals.length > 0 ? signals[signals.length - 1] : null;

  return (
    <div className="signals-panel">
      <h3 className="panel-title">Trading Signals</h3>
      
      {latestSignal ? (
        <div className="signal-card">
          <div className={`signal-header signal-${latestSignal.type.toLowerCase()}`}>
            <span className="signal-type">{latestSignal.type}</span>
            <span className="signal-trend">{latestSignal.trend}</span>
          </div>
          
          <div className="signal-details">
            <div className="detail-row">
              <span className="detail-label">Entry Price:</span>
              <span className="detail-value">${latestSignal.price.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Stop-Loss:</span>
              <span className="detail-value stop-loss">${latestSignal.stopLoss.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Target:</span>
              <span className="detail-value target">${latestSignal.target.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Risk:Reward:</span>
              <span className={`detail-value ${latestSignal.riskRewardRatio >= 3 ? 'good-rr' : 'bad-rr'}`}>
                1:{latestSignal.riskRewardRatio.toFixed(2)}
                {latestSignal.riskRewardRatio < 3 && (
                  <span className="warning-badge">⚠️ Min 1:3</span>
                )}
              </span>
            </div>
            <div className="signal-reason">
              <strong>Reason:</strong> {latestSignal.reason}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-signal">
          <p>No active signals</p>
          <small>Signals appear when indicator conditions align</small>
        </div>
      )}

      {riskMetrics && (
        <div className="risk-widget">
          <h4 className="widget-title">Risk Management</h4>
          <div className="risk-details">
            <div className="risk-row">
              <span>Account Size:</span>
              <span>${riskMetrics.accountSize.toLocaleString()}</span>
            </div>
            <div className="risk-row">
              <span>Risk per Trade:</span>
              <span>{riskMetrics.riskPercentage}% (${riskMetrics.riskAmount.toFixed(2)})</span>
            </div>
            <div className="risk-row">
              <span>Position Size:</span>
              <span className="highlight">{riskMetrics.positionSize} shares</span>
            </div>
            <div className="risk-row">
              <span>Stop Distance:</span>
              <span>${riskMetrics.stopLossDistance.toFixed(2)}</span>
            </div>
            <div className="risk-row">
              <span>Risk:Reward Ratio:</span>
              <span className={riskMetrics.riskRewardRatio >= 3 ? 'good-rr' : 'bad-rr'}>
                1:{riskMetrics.riskRewardRatio.toFixed(2)}
              </span>
            </div>
            {riskMetrics.riskRewardRatio < 3 && (
              <div className="rr-warning">
                ⚠️ Minimum 1:3 R:R required for profitable strategies
              </div>
            )}
          </div>
        </div>
      )}

      {supportResistance.length > 0 && (
        <div className="sr-levels">
          <h4 className="widget-title">Support & Resistance</h4>
          <div className="sr-list">
            {supportResistance.slice(0, 5).map((level, idx) => (
              <div key={idx} className={`sr-item sr-${level.type}`}>
                <span className="sr-price">${level.level.toFixed(2)}</span>
                <span className="sr-strength">
                  {'★'.repeat(level.strength)}{'☆'.repeat(5 - level.strength)}
                </span>
                <span className="sr-touches">{level.touches} touches</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

