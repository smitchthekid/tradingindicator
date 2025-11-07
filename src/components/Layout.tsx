import React from 'react';
import './Layout.css';

interface LayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ leftPanel, rightPanel }) => {
  return (
    <div className="layout">
      <header className="header">
        <h1>Indicator Configurator</h1>
        <p className="subtitle">Configure and preview trading indicators in real-time</p>
      </header>
      <div className="panels">
        <div className="panel-left">
          {leftPanel}
        </div>
        <div className="panel-right">
          {rightPanel}
        </div>
      </div>
    </div>
  );
};

