/**
 * Custom hook for alert management
 * Centralizes alert state and operations
 */

import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { alertsAtom } from '../atoms/alerts';
import { setAlertSetter } from '../utils/logger';

export function useAlerts() {
  const [alerts, setAlerts] = useAtom(alertsAtom);
  
  useEffect(() => {
    setAlertSetter(setAlerts);
  }, [setAlerts]);
  
  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };
  
  const clearAllAlerts = () => {
    setAlerts([]);
  };
  
  return {
    alerts,
    dismissAlert,
    clearAllAlerts,
  };
}

