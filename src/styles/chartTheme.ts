/**
 * Chart theme and shared styles
 * Centralized styling for chart components
 */

export const chartTheme = {
  colors: {
    primary: '#F1F5F9',
    ema: '#14B8A6',
    volatilityBand: '#10B981',
    atr: '#8B5CF6',
    forecast: '#F59E0B',
    volumeUp: 'rgba(16, 185, 129, 0.4)',
    volumeDown: 'rgba(239, 68, 68, 0.4)',
    support: '#10B981',
    resistance: '#EF4444',
    buy: '#10B981',
    sell: '#EF4444',
    stopLoss: '#EF4444',
    target: '#10B981',
    grid: '#334155',
    text: '#94A3B8',
    textSecondary: '#CBD5E1',
    background: '#1E293B',
    border: '#475569',
  },
  
  tooltip: {
    backgroundColor: '#1E293B',
    border: '1px solid #475569',
    borderRadius: '6px',
    color: '#F1F5F9',
    padding: '0.5rem',
  },
  
  legend: {
    wrapperStyle: { color: '#CBD5E1', paddingTop: '1rem' },
    iconType: 'line' as const,
    containerStyle: { paddingTop: '1rem', display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' },
    groupStyle: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const },
    itemStyle: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' },
    iconStyle: { 
      display: 'inline-block', 
      width: '20px', 
      height: '2px',
    },
    forecastGroupStyle: {
      padding: '0.5rem', 
      background: 'rgba(245, 158, 11, 0.1)', 
      borderRadius: '4px',
      border: '1px solid rgba(245, 158, 11, 0.3)'
    },
    forecastLabelStyle: {
      fontSize: '0.7rem', 
      color: '#F59E0B', 
      marginBottom: '0.25rem', 
      fontWeight: '600'
    },
  },
  
  grid: {
    strokeDasharray: '3 3',
    stroke: '#334155',
    strokeOpacity: 0.3,
  },
  
  axes: {
    stroke: '#94A3B8',
    tick: { fill: '#94A3B8', fontSize: 11 },
  },
  
  margins: {
    default: { top: 5, right: 30, left: 20, bottom: 80 },
    withATR: { top: 5, right: 120, left: 20, bottom: 80 },
  },
  
  lineStyles: {
    price: {
      stroke: '#F1F5F9',
      strokeWidth: 2,
    },
    ema: {
      stroke: '#14B8A6',
      strokeWidth: 1.5,
    },
    band: {
      stroke: '#10B981',
      strokeWidth: 1,
      strokeDasharray: '5 5',
      strokeOpacity: 0.6,
    },
    forecast: {
      stroke: '#F59E0B',
      strokeWidth: 2.5,
      strokeDasharray: '5 5',
    },
    forecastBound: {
      stroke: '#F59E0B',
      strokeWidth: 1,
      strokeDasharray: '3 3',
      strokeOpacity: 0.4,
    },
    atr: {
      stroke: '#8B5CF6',
      strokeWidth: 1.5,
      strokeOpacity: 0.7,
    },
  },
  
  referenceLine: {
    today: {
      stroke: '#94A3B8',
      strokeWidth: 2,
      strokeDasharray: '8 4',
      strokeOpacity: 0.6,
    },
    signal: {
      strokeWidth: 2,
      strokeDasharray: '4 4',
      strokeOpacity: 0.5,
    },
    stopLoss: {
      stroke: '#EF4444',
      strokeWidth: 1.5,
      strokeDasharray: '5 5',
      strokeOpacity: 0.6,
    },
    target: {
      stroke: '#10B981',
      strokeWidth: 1.5,
      strokeDasharray: '5 5',
      strokeOpacity: 0.6,
    },
    supportResistance: {
      strokeWidth: 1,
      strokeDasharray: '2 2',
      strokeOpacity: 0.5,
    },
  },
  
  backgroundShading: {
    highVolatility: {
      fill: 'rgba(239, 68, 68, 0.1)',
      stroke: 'none',
    },
  },
  
  volumeBar: {
    radius: [2, 2, 0, 0] as [number, number, number, number],
  },
  
  containerStyle: {
    width: '100%',
    height: '500px',
    minHeight: '500px',
  },
};

