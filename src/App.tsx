import React from 'react';
import { Provider } from 'jotai';
import { Layout } from './components/Layout';
import { ConfigPanel } from './components/ConfigPanel';
import { ChartPreview } from './components/ChartPreview';
import './styles/index.css';

function App() {
  return (
    <Provider>
      <Layout
        leftPanel={<ConfigPanel />}
        rightPanel={<ChartPreview />}
      />
    </Provider>
  );
}

export default App;

