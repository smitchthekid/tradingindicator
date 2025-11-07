import React, { useState } from 'react';
import './MetricsTabs.css';

interface MetricTab {
  id: string;
  label: string;
  value: string | React.ReactNode;
  description: string;
}

interface MetricsTabsProps {
  metrics: MetricTab[];
}

export const MetricsTabs: React.FC<MetricsTabsProps> = ({ metrics }) => {
  const [activeTab, setActiveTab] = useState(metrics[0]?.id || '');

  if (metrics.length === 0) return null;

  const activeMetric = metrics.find(m => m.id === activeTab) || metrics[0];

  return (
    <div className="metrics-tabs-container">
      <div className="metrics-tabs-header">
        <h3 className="metrics-title">Chart Metrics</h3>
        <div className="tabs-wrapper">
          <div className="tabs-scroll">
            {metrics.map((metric) => (
              <button
                key={metric.id}
                className={`tab-button ${activeTab === metric.id ? 'active' : ''}`}
                onClick={() => setActiveTab(metric.id)}
                aria-label={`View ${metric.label}`}
              >
                <span className="tab-label">{metric.label}</span>
                <span className="tab-value-small">{metric.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="tab-content-panel">
        <div className="tab-content-header">
          <span className="tab-content-label">{activeMetric.label}</span>
          <span className="tab-content-value">{activeMetric.value}</span>
        </div>
        <p className="metric-description">
          <strong>Bottom Line Impact:</strong> {activeMetric.description}
        </p>
      </div>
    </div>
  );
};

