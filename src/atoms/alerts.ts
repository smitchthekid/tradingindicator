import { atom } from 'jotai';

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: number;
  source?: string; // e.g., 'forecasting', 'api', 'signals'
  dismissible?: boolean;
}

// Atom to store all active alerts
export const alertsAtom = atom<Alert[]>([]);

// Helper function to generate unique alert IDs
let alertIdCounter = 0;
export const generateAlertId = () => `alert-${Date.now()}-${++alertIdCounter}`;

