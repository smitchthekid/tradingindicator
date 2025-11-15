import { atom } from 'jotai';
import { OHLCVData, CalculatedIndicators } from '../types';

export const marketDataAtom = atom<OHLCVData[]>([]);
export const indicatorsAtom = atom<CalculatedIndicators | null>(null);
export const loadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);
// Trigger atom for manual data refresh
export const refreshTriggerAtom = atom<number>(0);

