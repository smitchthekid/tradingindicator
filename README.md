# Indicator Configurator

A modern, user-centric trading indicator configuration tool built with React, TypeScript, and Vite. This application allows traders to configure and preview technical indicators in real-time with reliable market data integration.

## Features

- **Real-time Configuration**: Adjust indicator parameters and see immediate updates in the chart preview
- **Multiple Indicators**: Configure EMA, ATR, and Volatility Bands with customizable periods and colors
- **Risk Management**: Calculate position sizes and ATR-based stop-losses based on account size and risk percentage
- **Data Integration**: Fetch historical OHLCV data from Alpha Vantage or EODHD APIs
- **Token Optimization**: 
  - 5-minute cache to minimize API calls
  - Manual refresh button for on-demand updates
  - Debounced symbol changes to prevent unnecessary requests
  - Cache status indicator shows data freshness
- **Export/Import**: Save and load configuration presets as JSON files
- **Persistent Storage**: Automatically saves configuration to localStorage
- **Validation**: Inline validation using Zod schemas
- **Help System**: Contextual help overlay explaining each parameter

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Get an API key:
   - [Alpha Vantage](https://www.alphavantage.co/support/#api-key) (free tier available)
   - [EODHD](https://eodhistoricaldata.com/) (free tier available)

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Usage

1. Enter a stock symbol (e.g., AAPL, MSFT, TSLA)
2. Select your API provider and enter your API key (pre-filled with provided key)
3. Configure your indicators:
   - Enable/disable indicators
   - Adjust periods and multipliers
   - Customize colors
4. Set risk management parameters:
   - Account size
   - Risk percentage
   - ATR stop-loss multiplier
5. View real-time calculations in the chart preview
6. Use the Refresh button to update data (data is cached for 5 minutes to save API calls)
7. Export your configuration for later use

### Token Optimization

The app is designed to minimize API calls and work within rate limits:

- **Automatic Caching**: Data is cached for 5 minutes per symbol/provider combination
- **Smart Loading**: Only fetches from API when cache is missing or expired
- **Manual Refresh**: Use the Refresh button to force an API update when needed
- **Debounced Input**: Symbol changes are debounced (500ms) to prevent rapid API calls
- **Cache Indicator**: Shows when data is from cache and how old it is

This design helps you stay within free tier limits (e.g., Alpha Vantage's 5 calls/minute, 500 calls/day).

## Project Structure

```
src/
├── atoms/          # Jotai state management
├── components/     # React components
├── schemas/        # Zod validation schemas
├── services/       # API services
├── styles/         # Global styles
├── types/          # TypeScript types
└── utils/          # Calculation utilities
```

## Technologies

- **Vite**: Fast build tool and dev server
- **React 18**: UI library
- **TypeScript**: Type safety
- **Jotai**: Atomic state management
- **Zod**: Schema validation
- **Recharts**: Charting library
- **Alpha Vantage / EODHD**: Market data APIs

## Design Principles

- **User-Centered Design**: Intuitive interface with clear visual hierarchy
- **Real-time Feedback**: Immediate updates as parameters change
- **Validation**: Inline error messages near inputs
- **Consistency**: Shared design system across all components
- **Accessibility**: Semantic HTML and ARIA labels

## License

MIT

