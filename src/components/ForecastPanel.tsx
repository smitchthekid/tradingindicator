import React from 'react';
import { ForecastResult } from '../types/forecast';
import './ForecastPanel.css';

interface ForecastPanelProps {
  forecast: ForecastResult | null;
  currentPrice: number;
}

export const ForecastPanel: React.FC<ForecastPanelProps> = ({ forecast, currentPrice }) => {
  if (!forecast) {
    return (
      <div className="forecast-panel">
        <h3 className="panel-title">Price Forecast</h3>
        <div className="no-forecast">
          <p>Enable forecasting in settings to see predictions</p>
        </div>
      </div>
    );
  }

  // Check if forecast arrays are empty or invalid
  if (!forecast.predicted || forecast.predicted.length === 0) {
    return (
      <div className="forecast-panel">
        <h3 className="panel-title">Price Forecast</h3>
        <div className="no-forecast">
          <p>Forecast data unavailable. Check date range and try again.</p>
        </div>
      </div>
    );
  }

  const nextWeekIndex = Math.min(6, forecast.predicted.length - 1);
  const nextMonthIndex = forecast.predicted.length - 1;
  
  const nextWeekPrice = forecast.predicted[nextWeekIndex];
  const nextMonthPrice = forecast.predicted[nextMonthIndex];
  
  // Validate prices are valid numbers
  if (!nextWeekPrice || isNaN(nextWeekPrice) || !nextMonthPrice || isNaN(nextMonthPrice)) {
    return (
      <div className="forecast-panel">
        <h3 className="panel-title">Price Forecast</h3>
        <div className="no-forecast">
          <p>Forecast data is invalid. Please refresh and try again.</p>
        </div>
      </div>
    );
  }
  
  const weekChange = ((nextWeekPrice - currentPrice) / currentPrice) * 100;
  const monthChange = ((nextMonthPrice - currentPrice) / currentPrice) * 100;

  const getBiasColor = (bias: number) => {
    if (bias > 0.1) return 'var(--accent-green)';
    if (bias < -0.1) return 'var(--accent-red)';
    return 'var(--text-muted)';
  };

  const getBiasText = (bias: number, _direction: string) => {
    if (bias > 0.1) return 'Model expects higher prices—consider buying';
    if (bias < -0.1) return 'Model expects lower prices—consider selling';
    return 'Model suggests neutral outlook';
  };

  return (
    <div className="forecast-panel">
      <h3 className="panel-title">Price Forecast</h3>
      
      <div className="forecast-summary">
        <div className="forecast-header">
          <span className="model-badge">{forecast.model}</span>
          <span className={`direction-badge direction-${forecast.direction.toLowerCase()}`}>
            {forecast.direction}
          </span>
        </div>
        
        <div className="bias-message" style={{ color: getBiasColor(forecast.bias) }}>
          <strong>📊 {getBiasText(forecast.bias, forecast.direction)}</strong>
        </div>
        
        <div className="forecast-predictions">
          <div className="prediction-item">
            <span className="prediction-label">Next Week:</span>
            <span className={`prediction-value ${weekChange >= 0 ? 'positive' : 'negative'}`}>
              ${nextWeekPrice.toFixed(2)} ({weekChange >= 0 ? '+' : ''}{weekChange.toFixed(2)}%)
            </span>
          </div>
          <div className="prediction-item">
            <span className="prediction-label">Next Month:</span>
            <span className={`prediction-value ${monthChange >= 0 ? 'positive' : 'negative'}`}>
              ${nextMonthPrice.toFixed(2)} ({monthChange >= 0 ? '+' : ''}{monthChange.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        {forecast.metrics && forecast.metrics.directionalAccuracy !== undefined && (
          <div className="forecast-metrics">
            <div className="metric-row">
              <span>Directional Accuracy:</span>
              <span>{(forecast.metrics.directionalAccuracy * 100).toFixed(1)}%</span>
            </div>
            {forecast.metrics.rmse !== undefined && (
              <div className="metric-row">
                <span>RMSE:</span>
                <span>${forecast.metrics.rmse.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="forecast-disclaimer">
          <small>⚠️ Predictions are estimates, not guarantees. Past performance doesn't guarantee future results.</small>
        </div>
      </div>
    </div>
  );
};

