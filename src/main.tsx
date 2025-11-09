import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { clearCache, clearAllCache } from './utils/cache'
import { forecastCache } from './atoms/forecast'

// Expose cache clearing functions to window for debugging
if (typeof window !== 'undefined') {
  (window as any).clearCache = clearCache;
  (window as any).clearAllCache = clearAllCache;
  (window as any).clearForecastCache = () => {
    forecastCache.clear();
    console.log('Forecast cache cleared');
  };
  console.log('Cache utilities available: clearCache(), clearAllCache(), clearForecastCache()');
}

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    fontFamily: "'Raleway', sans-serif", 
    background: '#0a0e27', 
    color: '#e0e0e0' 
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '4px solid #1a1f3a', 
        borderTop: '4px solid #4a9eff', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite', 
        margin: '0 auto 20px' 
      }}></div>
      <p style={{ margin: 0, fontSize: '16px' }}>Loading Indicator Configurator...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  </React.StrictMode>,
)

