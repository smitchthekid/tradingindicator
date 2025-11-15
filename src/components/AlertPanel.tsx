import React from 'react';
import { useAtom } from 'jotai';
import { alertsAtom } from '../atoms/alerts';
import './AlertPanel.css';

export const AlertPanel: React.FC = () => {
  const [alerts, setAlerts] = useAtom(alertsAtom);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const dismissAll = () => {
    setAlerts([]);
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="alert-panel">
      <div className="alert-panel-header">
        <h4 className="alert-panel-title">
          Alerts ({alerts.length})
        </h4>
        {alerts.length > 1 && (
          <button
            className="alert-dismiss-all"
            onClick={dismissAll}
            aria-label="Dismiss all alerts"
          >
            Dismiss All
          </button>
        )}
      </div>
      <div className="alert-list">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`alert alert-${alert.type}`}
            role="alert"
          >
            <div className="alert-content">
              <div className="alert-icon">
                {alert.type === 'warning' && '⚠️'}
                {alert.type === 'error' && '❌'}
                {alert.type === 'info' && 'ℹ️'}
                {alert.type === 'success' && '✅'}
              </div>
              <div className="alert-message">
                <div className="alert-text">{alert.message}</div>
                {alert.source && (
                  <div className="alert-source">Source: {alert.source}</div>
                )}
              </div>
            </div>
            {alert.dismissible && (
              <button
                className="alert-dismiss"
                onClick={() => dismissAlert(alert.id)}
                aria-label="Dismiss alert"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

