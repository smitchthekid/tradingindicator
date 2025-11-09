import React from 'react'
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

