# Trading Indicator Configurator - Complete Architecture Summary

## Overview
A modern React-based trading indicator configuration tool that provides real-time technical analysis, forecasting, and risk management for stocks and cryptocurrencies. The application uses Yahoo Finance as the primary data source and implements multiple forecasting models with sophisticated caching and state management.

---

## Core Technologies & Dependencies

### Frontend Framework & Build Tools
- **React 18.2.0**: UI library with hooks and functional components
- **TypeScript 5.2.2**: Type safety and enhanced developer experience
- **Vite 6.0.0**: Fast build tool and development server with HMR
- **@vitejs/plugin-react**: React plugin for Vite

### State Management
- **Jotai 2.6.0**: Atomic state management library
  - Uses atoms for reactive state updates
  - Derived atoms for computed values
  - Persistent atoms with localStorage integration

### UI & Charting
- **Recharts 2.10.3**: Charting library for React
  - Line charts, area charts, candlestick visualization
  - Custom layers and tooltips
  - Responsive design

### Data Validation
- **Zod 3.22.4**: Schema validation library
  - Runtime type checking
  - Configuration validation
  - Error handling

### Date Utilities
- **date-fns 2.30.0**: Date manipulation and formatting
  - ISO date parsing
  - Date arithmetic (addDays, startOfDay)
  - Date validation

### Development Tools
- **ESLint**: Code linting with TypeScript support
- **TypeScript ESLint**: TypeScript-specific linting rules
- **serve 14.2.5**: Static file server for production builds

---

## Application Architecture

### Directory Structure
```
src/
├── atoms/          # Jotai state atoms
├── components/     # React UI components
│   └── chart/      # Chart-specific components
├── hooks/          # Custom React hooks
├── schemas/         # Zod validation schemas
├── services/       # API integration services
├── styles/          # CSS and theme files
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

---

## State Management (Jotai Atoms)

### Configuration Atoms (`src/atoms/config.ts`)
- **configAtom**: Main configuration state
  - EMA settings (enabled, period, color)
  - ATR settings (enabled, period, multiplier, color)
  - Volatility bands (enabled, period, multiplier, color)
  - Risk management (account size, risk percentage, ATR stop-loss multiplier)
  - Symbol, API provider, pro mode
  - Forecast configuration
- **validationErrorsAtom**: Derived atom for validation errors
- **persistConfigAtom**: Write-only atom that persists to localStorage

### Data Atoms (`src/atoms/data.ts`)
- **marketDataAtom**: OHLCV market data array
- **indicatorsAtom**: Calculated technical indicators
- **loadingAtom**: Loading state flag
- **errorAtom**: Error message state
- **refreshTriggerAtom**: Manual refresh trigger counter

### Forecast Atoms (`src/atoms/forecast.ts`)
- **forecastModelAtom**: Active forecast model ('simple', 'arima', 'prophet', 'lstm')
- **forecastEnabledAtom**: Forecast feature toggle
- **forecastPeriodAtom**: Number of days to forecast
- **forecastConfidenceAtom**: Confidence level (0-1)
- **simpleForecastAtom**: Simple MA forecast result
- **arimaForecastAtom**: ARIMA forecast result
- **prophetForecastAtom**: Prophet forecast result
- **lstmForecastAtom**: LSTM forecast result
- **forecastLoadingAtom**: Forecast computation loading state
- **forecastErrorAtom**: Forecast error state
- **forecastCache**: In-memory cache for forecast results

### Alert Atoms (`src/atoms/alerts.ts`)
- Alert management for user notifications

---

## Services Layer

### Yahoo Finance Service (`src/services/yahooFinance.ts`)
**Primary Data Source**
- **fetchYahooFinanceData()**: Main data fetching function
  - Normalizes crypto symbols (BTC → BTC-USD)
  - Uses proxy server to avoid CORS issues
  - Fetches 2 years of daily data
  - Converts Yahoo Finance format to OHLCVData
  - Validates price data (filters invalid/future dates)
  - Handles errors gracefully

**Symbol Normalization**
- Automatically appends "-USD" to crypto symbols
- Supports 30+ common cryptocurrencies
- Preserves stock symbols as-is

**Proxy Integration**
- Development: Uses Vite proxy (`/api/yahoo`)
- Production: Uses backend proxy server (configurable via `VITE_PROXY_URL`)
- Default proxy URL: `http://localhost:3002`

### API Service (`src/services/api.ts`)
**Market Data Fetching**
- **fetchMarketData()**: Unified API interface
  - Checks cache first (24-hour TTL)
  - Validates cached data quality
  - Falls back to Yahoo Finance if cache miss
  - Returns data with cache status flag
  - Handles symbol normalization

**Caching Strategy**
- 24-hour cache duration
- Per-symbol, per-provider cache keys
- Automatic cache invalidation
- Cache age tracking

### BigQuery Service (`src/services/bigquery.ts`)
**Alternative Data Source (Placeholder)**
- **fetchBigQueryData()**: Google BigQuery integration
  - Requires backend proxy for authentication
  - Currently supports Bitcoin blockchain data only
  - Note: Public datasets don't have direct price data
  - Included for future extensibility

---

## Utility Functions

### Technical Indicators (`src/utils/calculations.ts`)

**EMA (Exponential Moving Average)**
- **calculateEMA()**: Calculates EMA with configurable period
  - Uses multiplier: 2 / (period + 1)
  - Starts with SMA for first value
  - Returns array aligned with price data

**ATR (Average True Range)**
- **calculateATR()**: Volatility measurement
  - Calculates True Range: max(high-low, |high-prevClose|, |low-prevClose|)
  - Uses EMA smoothing (not SMA)
  - Returns array with NaN padding for initial periods

**Volatility Bands**
- **calculateVolatilityBands()**: Standard deviation-based bands
  - Calculates rolling mean and standard deviation
  - Upper band: mean + (stdDev × multiplier)
  - Lower band: mean - (stdDev × multiplier)
  - Returns { upper: number[], lower: number[] }

**Main Calculation Function**
- **calculateIndicators()**: Orchestrates all indicator calculations
  - Conditionally calculates based on config
  - Computes ATR-based stop loss
  - Calculates position size based on risk management
  - Returns CalculatedIndicators object

### Forecasting (`src/utils/forecasting.ts`)

**Short-Term Models (1-14 days)**
- **simpleMAForecast()**: Simple moving average with trend
  - Uses exponential smoothing for trend
  - Calculates empirical standard error
  - Generates prediction intervals
  - Returns ForecastResult with confidence bands

- **arimaForecast()**: ARIMA (AutoRegressive Integrated Moving Average)
  - Makes series stationary using differencing
  - Fits AR coefficients using Yule-Walker equations
  - Forecasts stationary series, then reverses differencing
  - Handles AR order and MA order automatically
  - Returns ForecastResult with proper confidence intervals

**Long-Term Models (7-90 days)**
- **prophetForecast()**: Prophet-like model with seasonality
  - Detects linear trend using regression
  - Detects weekly and monthly seasonality
  - Uses additive model: price = trend + seasonality
  - Calculates in-sample residuals for confidence bands
  - Returns ForecastResult with seasonal patterns

- **lstmForecast()**: LSTM-like with memory cells
  - Normalizes prices to 0-1 range
  - Uses sliding window sequence learning
  - Simulates LSTM gates (forget, input, output)
  - Maintains memory cell for long-term dependencies
  - Denormalizes to get price forecasts
  - Returns ForecastResult with higher uncertainty

**Forecast Utilities**
- **generateForecastDates()**: Creates unified forecast date array
  - Uses date-fns for date arithmetic
  - Starts from day after last historical date
  - Validates dates (no future dates)
  - Returns YYYY-MM-DD formatted dates

- **evaluateModel()**: Model performance evaluation
  - Calculates RMSE (Root Mean Squared Error)
  - Calculates MAE (Mean Absolute Error)
  - Calculates directional accuracy
  - Calculates cumulative return
  - Returns ModelEvaluation object

**Forecast Routing**
- **generateShortTermForecast()**: Routes to short-term models
- **generateLongTermForecast()**: Routes to long-term models
- **generateForecast()**: Legacy function for backward compatibility

### Trading Signals (`src/utils/signals.ts`)

**Signal Generation**
- **generateSignals()**: Multi-factor signal detection
  - BUY Signals:
    - Price crosses/stays above EMA(20)
    - Price above lower volatility band
    - Near support level (optional)
    - Minimum 1:3 risk-to-reward ratio
  - SELL Signals:
    - Price crosses below EMA with increasing ATR
    - ATR trailing stop crossed
    - Death cross (EMA crossover)
    - Price below EMA and below lower band
  - Enforces 1-2% capital risk per trade
  - Returns TradingSignal[] array

**Support/Resistance Detection**
- **detectSupportResistance()**: Identifies key price levels
  - Finds local highs (resistance) and lows (support)
  - Groups nearby levels (2% tolerance)
  - Calculates strength (1-5) based on touches
  - Returns SupportResistance[] array

**Risk Metrics**
- **calculateRiskMetrics()**: Position sizing and risk calculation
  - Calculates risk amount from account size and risk %
  - Calculates stop loss distance using ATR
  - Calculates position size
  - Calculates target price (1:3 R:R minimum)
  - Returns RiskMetrics object

**Helper Functions**
- **calculateATRTrailingStop()**: ATR-based trailing stop
- **detectDeathCross()**: EMA crossover detection

### Data Preprocessing (`src/utils/preprocessing.ts`)

**Stationarity**
- **makeStationary()**: Makes time series stationary
  - Uses differencing (up to maxDiffs)
  - Tests stationarity using simplified ADF test
  - Returns stationary series and number of differences

- **testStationarity()**: Simplified Augmented Dickey-Fuller test
  - Compares mean and variance across halves
  - Returns isStationary flag and p-value

**Normalization**
- **normalize()**: Normalizes values to 0-1 range
  - Returns normalized array, min, max
- **denormalize()**: Reverses normalization

**Data Preparation**
- **prepareForecastData()**: Prepares data for forecasting
  - Extracts prices and dates
  - Calculates log returns
  - Makes series stationary
  - Returns prepared data object

### Caching (`src/utils/cache.ts`)

**Market Data Cache**
- **getCachedData()**: Retrieves cached market data
  - Checks localStorage
  - Validates cache age (24 hours)
  - Validates symbol/provider match
  - Returns OHLCVData[] or null

- **setCachedData()**: Stores market data in cache
  - Stores with timestamp and metadata
  - Uses symbol/provider as cache key

- **clearCache()**: Clears all market data cache
- **clearAllCache()**: Clears market data + forecast cache
- **getCacheAge()**: Returns cache age in minutes

**Cache Strategy**
- 24-hour TTL for market data
- Per-symbol, per-provider isolation
- Automatic expiration
- Manual refresh capability

### Chart Data Utilities (`src/utils/chartData.ts`)

**Data Processing**
- **normalizeDate()**: Normalizes dates to midnight
- **sortChartDataByTimestamp()**: Sorts data by timestamp
- **filterValidHistoricalData()**: Filters invalid/future dates

**Domain Calculation**
- **calculateYDomain()**: Calculates Y-axis domain for prices
  - Uses median and standard deviation
  - Adds padding (default 5%)
  - Returns [min, max] tuple

- **calculateVolumeDomain()**: Calculates volume Y-axis domain
- **calculateATRDomain()**: Calculates ATR Y-axis domain
- **calculateATRThresholds()**: Calculates ATR thresholds for background shading

### Scheduling (`src/utils/scheduler.ts`)
- **scheduleIdleCallback()**: Schedules tasks during idle time
- **scheduleTasks()**: Schedules multiple tasks with delays
- Used for non-blocking forecast computation

### Logging (`src/utils/logger.ts`)
- Centralized logging utility
- Error, warning, and info logging
- Console-based with optional external integration

---

## Custom React Hooks

### useIndicators (`src/hooks/useIndicators.ts`)
**Purpose**: Manages indicator calculations, signals, and risk metrics

**Returns**:
- `indicators`: CalculatedIndicators object
- `signals`: TradingSignal[] array
- `supportResistance`: SupportResistance[] array
- `riskMetrics`: RiskMetrics object

**Features**:
- Automatic recalculation on config changes
- Error handling with fallback to last valid values
- Prevents flickering during updates

### useForecasts (`src/hooks/useForecasts.ts`)
**Purpose**: Manages forecast computation and caching

**Returns**:
- `forecastModel`: Active model name
- `forecastEnabled`: Enabled flag
- `forecastPeriod`: Forecast period
- `forecastConfidence`: Confidence level
- `simpleForecast`: Simple MA forecast result
- `arimaForecast`: ARIMA forecast result
- `prophetForecast`: Prophet forecast result
- `lstmForecast`: LSTM forecast result
- `activeForecast`: Currently selected forecast

**Features**:
- Computes all forecasts in background
- Uses forecast cache to avoid recomputation
- Schedules heavy computations with delays
- Evicts cache on symbol change

### useAlerts (`src/hooks/useAlerts.ts`)
**Purpose**: Manages user alerts and notifications

---

## Components Architecture

### Layout Components

**Layout** (`src/components/Layout.tsx`)
- Main application layout
- Two-panel design (settings + chart)
- Responsive CSS Grid

**ConfigPanel** (`src/components/ConfigPanel.tsx`)
- Configuration UI
- Sections for each indicator type
- Risk management settings
- Forecast configuration

**ConfigSection** (`src/components/ConfigSection.tsx`)
- Reusable configuration section component
- Collapsible sections
- Inline validation

**ApiSettings** (`src/components/ApiSettings.tsx`)
- API provider selection
- Symbol input
- API key input (for future providers)
- Cache status display

### Chart Components

**ChartPreview** (`src/components/ChartPreview.tsx`)
- Main chart container
- Integrates all chart layers
- Handles data transformation
- Manages chart state

**Chart Layers** (`src/components/chart/`)
- **PriceLayer**: Candlestick/line chart for prices
- **EMALayer**: EMA line overlay
- **ATRLayer**: ATR visualization
- **ATRBackgroundLayer**: ATR-based background shading
- **VolatilityBandsLayer**: Upper/lower band visualization
- **VolumeLayer**: Volume bars
- **ForecastLayer**: Forecast visualization with confidence bands
- **ReferenceLinesLayer**: Support/resistance lines
- **ChartAxes**: Custom axis components
- **ChartLegend**: Legend display
- **ChartTooltip**: Interactive tooltip

### Analysis Components

**SignalsPanel** (`src/components/SignalsPanel.tsx`)
- Displays trading signals
- Signal details (entry, stop, target, R:R)
- Signal filtering and sorting

**ForecastPanel** (`src/components/ForecastPanel.tsx`)
- Forecast model selection
- Forecast visualization
- Model comparison
- Confidence level adjustment

**MetricsTabs** (`src/components/MetricsTabs.tsx`)
- Risk metrics display
- Position sizing calculator
- Performance metrics

**BacktestingTab** (`src/components/BacktestingTab.tsx`)
- Backtesting interface
- Historical performance analysis

**AlertPanel** (`src/components/AlertPanel.tsx`)
- User alerts and notifications
- Error messages
- Warnings

### Utility Components

**Tooltip** (`src/components/Tooltip.tsx`)
- Reusable tooltip component
- Position calculation
- Styling

**SignalTooltip** (`src/components/SignalTooltip.tsx`)
- Specialized tooltip for trading signals

---

## Type Definitions (`src/types/`)

### Core Types (`src/types/index.ts`)
- **OHLCVData**: Open, High, Low, Close, Volume data point
- **IndicatorConfig**: Complete configuration object
- **CalculatedIndicators**: Calculated indicator arrays
- **TradingSignal**: Trading signal with entry/exit points
- **SupportResistance**: Support/resistance level
- **RiskMetrics**: Risk calculation results
- **Preset**: Saved configuration preset

### Forecast Types (`src/types/forecast.ts`)
- **ForecastResult**: Forecast output with confidence bands
- **ForecastConfig**: Forecast configuration
- **ModelEvaluation**: Model performance metrics
- **ShortTermModel**: 'simple' | 'arima'
- **LongTermModel**: 'prophet' | 'lstm'

---

## Validation Schemas (`src/schemas/validation.ts`)

**indicatorConfigSchema**: Zod schema for IndicatorConfig
- Validates all configuration fields
- Type checking
- Range validation (periods, percentages, etc.)
- Required field validation

---

## Backend Proxy Server (`server/proxy.js`)

**Technology**: Node.js with Express

**Dependencies**:
- express: Web server
- cors: CORS middleware
- node-fetch: HTTP client

**Endpoints**:
- `GET /health`: Health check
- `GET /api/yahoo?symbol=SYMBOL`: Yahoo Finance proxy

**Features**:
- CORS enabled for all routes
- Symbol normalization (BTC → BTC-USD)
- Error handling
- Logging

**Configuration**:
- Port: 3002 (configurable via PROXY_PORT env var)
- Default: `http://localhost:3002`

---

## Styling

### Global Styles (`src/styles/index.css`)
- CSS variables for theming
- Dark theme (primary: #0a0e27)
- Typography (Raleway font family)
- Responsive design
- Component-specific styles

### Chart Theme (`src/styles/chartTheme.ts`)
- Recharts theme configuration
- Color palette
- Grid and axis styling

### Component Styles
- Modular CSS files per component
- BEM-like naming convention
- Responsive breakpoints

---

## Build Configuration

### Vite Config (`vite.config.ts`)
- React plugin
- Development server on port 3001
- Proxy configuration for `/api/yahoo`
- Code splitting:
  - `react-vendor`: React, React-DOM
  - `chart-vendor`: Recharts
  - `utils-vendor`: date-fns, Zod
  - `state-vendor`: Jotai
- Chunk size warning limit: 1000KB

### TypeScript Config
- `tsconfig.json`: Main TypeScript configuration
- `tsconfig.node.json`: Node.js-specific config
- Strict mode enabled
- ES2020 target
- Module resolution: bundler

---

## Data Flow

1. **User Input** → ConfigPanel updates configAtom
2. **Config Change** → Triggers data fetch if symbol changed
3. **Data Fetch** → Checks cache → Fetches from API if needed
4. **Data Received** → Updates marketDataAtom
5. **Market Data Change** → useIndicators hook calculates indicators
6. **Indicators Calculated** → Updates indicatorsAtom
7. **Indicators Change** → ChartPreview re-renders with new data
8. **Forecast Trigger** → useForecasts hook computes forecasts
9. **Forecasts Computed** → Updates forecast atoms
10. **UI Update** → All components reactively update

---

## Key Features

### Real-Time Configuration
- Immediate updates as parameters change
- No manual refresh needed
- Optimistic UI updates

### Caching Strategy
- 24-hour market data cache
- Forecast result caching
- Cache invalidation on symbol change
- Manual cache clearing

### Error Handling
- Graceful degradation
- Error messages in UI
- Fallback to last valid values
- Retry mechanisms

### Performance Optimizations
- Code splitting
- Lazy loading
- Idle callback scheduling
- Debounced inputs
- Memoized calculations

### Risk Management
- Position sizing calculator
- ATR-based stop loss
- Risk-to-reward ratio enforcement (1:3 minimum)
- Capital risk limits (1-2% per trade)

### Forecasting
- Multiple models (Simple, ARIMA, Prophet, LSTM)
- Confidence bands
- Model comparison
- Short-term vs long-term models

---

## Environment Variables

- `VITE_PROXY_URL`: Backend proxy server URL (default: `http://localhost:3002`)
- `PROXY_PORT`: Proxy server port (default: 3002)

---

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run proxy`: Start proxy server
- `npm start`: Serve production build

---

## Browser APIs Used

- **localStorage**: Configuration and cache persistence
- **fetch**: API requests
- **requestIdleCallback**: Background task scheduling
- **Date**: Date manipulation
- **JSON**: Data serialization

---

## External APIs

### Yahoo Finance
- **Endpoint**: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`
- **Parameters**: `interval=1d&range=2y&includePrePost=false`
- **Response Format**: JSON with chart.result array
- **Rate Limits**: None (public API)
- **CORS**: Requires proxy server

---

## Future Extensibility

### Potential Data Sources
- Alpha Vantage (requires API key)
- EODHD (requires API key)
- Google BigQuery (requires authentication)
- Custom data sources

### Potential Features
- Real-time data streaming
- Multiple symbol comparison
- Portfolio management
- Order execution integration
- Advanced backtesting
- Machine learning model training

---

## Security Considerations

- API keys stored in localStorage (not secure for production)
- CORS handled via proxy server
- Input validation via Zod schemas
- XSS protection via React's built-in escaping
- No sensitive data in client-side code

---

## Performance Metrics

- Initial load: Optimized with code splitting
- Chart rendering: Efficient with Recharts
- Forecast computation: Background processing
- Cache hit rate: Reduces API calls significantly
- Memory usage: Controlled with cache limits

---

## Testing Considerations

- Unit tests: Utility functions
- Integration tests: API services
- Component tests: React components
- E2E tests: User workflows
- Performance tests: Large datasets

---

This summary provides a comprehensive overview of all tools, functions, and architecture used in the Trading Indicator Configurator application. Use this as a reference for rebuilding or extending the application.



