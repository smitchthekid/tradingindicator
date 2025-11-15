/**
 * Production-safe logger that can be disabled
 * In production builds, console statements are removed/minified
 * This wrapper allows conditional logging and UI alert integration
 */

const isDevelopment = import.meta.env.DEV;

// Store setter function for alerts (set by ChartPreview component)
let setAlerts: ((updater: (prev: any[]) => any[]) => void) | null = null;

// Counter for generating unique alert IDs
let alertIdCounter = 0;
const generateAlertId = () => `alert-${Date.now()}-${++alertIdCounter}`;

export const setAlertSetter = (setter: (updater: (prev: any[]) => any[]) => void) => {
  setAlerts = setter;
};

// Function to clear forecast-related alerts when forecast period changes
export const clearForecastAlerts = () => {
  if (setAlerts) {
    setAlerts((prev: any[]) => {
      return prev.filter((alert) => {
        // Remove alerts related to forecast period warnings
        const message = alert.message || '';
        return !(
          message.includes('Short-term forecast requested') ||
          message.includes('Long-term forecast requested') ||
          message.includes('Consider using')
        );
      });
    });
  }
};

const addAlert = (type: 'warning' | 'error' | 'info' | 'success', message: string, source?: string) => {
  if (setAlerts) {
    // Check if an alert with the same message already exists to prevent duplicates
    setAlerts((prev: any[]) => {
      // Check if this exact message already exists
      const duplicateExists = prev.some(
        (alert) => alert.message === message && alert.type === type && alert.source === source
      );
      
      if (duplicateExists) {
        return prev; // Don't add duplicate
      }
      
      const alert = {
        id: generateAlertId(),
        type,
        message,
        timestamp: Date.now(),
        source,
        dismissible: true,
      };
      return [...prev, alert];
    });
  }
};

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
    if (isDevelopment) {
      console.warn(...args);
    }
    // Add warning to UI alerts
    addAlert('warning', message, 'system');
  },
  error: (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
    // Always log errors, even in production
    console.error(...args);
    // Add error to UI alerts
    addAlert('error', message, 'system');
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
    // Optionally add info to UI alerts
    // addAlert('info', message, 'system');
  },
};

