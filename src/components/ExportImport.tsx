import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { configAtom, persistConfigAtom } from '../atoms/config';
import { IndicatorConfig, Preset } from '../types';
import './ExportImport.css';

export const ExportImport: React.FC = () => {
  const [config] = useAtom(configAtom);
  const [, persistConfig] = useAtom(persistConfigAtom);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = () => {
    try {
      const preset: Preset = {
        id: Date.now().toString(),
        name: `Preset ${new Date().toLocaleDateString()}`,
        config,
        createdAt: new Date().toISOString(),
      };
      
      const dataStr = JSON.stringify(preset, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `indicator-config-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Configuration exported successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export configuration' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const preset = JSON.parse(content) as Preset;
        
        if (preset.config) {
          persistConfig(preset.config);
          setMessage({ type: 'success', text: 'Configuration imported successfully!' });
          setTimeout(() => setMessage(null), 3000);
        } else {
          throw new Error('Invalid preset format');
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to import configuration. Invalid file format.' });
        setTimeout(() => setMessage(null), 3000);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="export-import">
      <h3 className="section-title">Export / Import</h3>
      <div className="export-import-buttons">
        <button onClick={handleExport} className="export-button">
          Export Config
        </button>
        <label htmlFor="import-file" className="import-button">
          Import Config
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      {message && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      )}
    </div>
  );
};

