import React from 'react';
import { Provider } from 'jotai';
import { Layout } from './components/Layout';
import { ConfigPanel } from './components/ConfigPanel';
import { ChartPreview } from './components/ChartPreview';
import './styles/index.css';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          background: '#0F172A',
          color: '#F1F5F9',
          minHeight: '100vh',
          fontFamily: 'Raleway, sans-serif'
        }}>
          <h1 style={{ color: '#EF4444' }}>Something went wrong</h1>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: '1rem' }}>
            <summary>Error Details</summary>
            <pre style={{
              background: '#1E293B',
              padding: '1rem',
              borderRadius: '6px',
              overflow: 'auto',
              marginTop: '0.5rem'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Provider>
        <Layout
          settingsPanel={<ConfigPanel />}
          chartPanel={<ChartPreview />}
        />
      </Provider>
    </ErrorBoundary>
  );
}

export default App;

