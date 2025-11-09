import React from 'react';
import { TradingSignal } from '../types';

interface SignalTooltipProps {
  signal: TradingSignal;
  x?: number;
  y?: number;
}

export const SignalTooltip: React.FC<SignalTooltipProps> = ({ signal, x, y }) => {
  if (!signal) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x !== undefined ? `${x}px` : 'auto',
        top: y !== undefined ? `${y}px` : 'auto',
        backgroundColor: '#1E293B',
        border: `2px solid ${signal.type === 'BUY' ? '#10B981' : '#EF4444'}`,
        borderRadius: '8px',
        padding: '0.75rem',
        color: '#F1F5F9',
        fontSize: '0.875rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        minWidth: '200px',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: signal.type === 'BUY' ? '#10B981' : '#EF4444' }}>
        {signal.type} Signal
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <span style={{ color: '#94A3B8' }}>Entry:</span>{' '}
        <span style={{ fontWeight: '600' }}>${signal.price.toFixed(2)}</span>
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <span style={{ color: '#94A3B8' }}>Stop Loss:</span>{' '}
        <span style={{ fontWeight: '600', color: '#EF4444' }}>${signal.stopLoss.toFixed(2)}</span>
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <span style={{ color: '#94A3B8' }}>Target:</span>{' '}
        <span style={{ fontWeight: '600', color: '#10B981' }}>${signal.target.toFixed(2)}</span>
      </div>
      {signal.riskRewardRatio > 0 && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #475569' }}>
          <span style={{ color: '#94A3B8' }}>R:R Ratio:</span>{' '}
          <span style={{ fontWeight: '600' }}>{signal.riskRewardRatio.toFixed(2)}:1</span>
        </div>
      )}
      {signal.reason && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #475569', fontSize: '0.75rem', color: '#CBD5E1' }}>
          {signal.reason}
        </div>
      )}
    </div>
  );
};

