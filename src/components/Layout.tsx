import React from 'react';
import './Layout.css';

interface LayoutProps {
  settingsPanel: React.ReactNode;
  chartPanel: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ settingsPanel, chartPanel }) => {
  return (
    <div className="layout">
      <header className="header">
        <h1>Indicator Configurator</h1>
        <p className="subtitle">Configure and preview trading indicators in real-time</p>
      </header>
      <div className="settings-top">
        {settingsPanel}
      </div>
      <div className="chart-panel-full">
        {chartPanel}
      </div>
    </div>
  );
};

