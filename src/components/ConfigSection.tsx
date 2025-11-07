import React from 'react';
import { Tooltip } from './Tooltip';
import './ConfigSection.css';

interface FieldConfig {
  key: string;
  label: string;
  type: 'checkbox' | 'number' | 'color' | 'select';
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
  options?: { value: string; label: string }[];
}

interface ConfigSectionProps<T> {
  title: string;
  config: T;
  onUpdate: (config: T) => void;
  fields: FieldConfig[];
  description?: string;
}

export function ConfigSection<T extends Record<string, any>>({
  title,
  config,
  onUpdate,
  fields,
  description,
}: ConfigSectionProps<T>) {
  const handleChange = (key: string, value: any) => {
    onUpdate({ ...config, [key]: value });
  };

  return (
    <div className="config-section">
      <h3 className="section-title">{title}</h3>
      {description && (
        <p className="section-description">{description}</p>
      )}
      <div className="section-fields">
        {fields.map((field) => (
          <div key={field.key} className="field">
            <label htmlFor={field.key}>
              {field.label}
              {field.tooltip && (
                <Tooltip content={field.tooltip}>
                  <span className="tooltip-icon">ℹ️</span>
                </Tooltip>
              )}
            </label>
            {field.type === 'checkbox' ? (
              <input
                id={field.key}
                type="checkbox"
                checked={config[field.key] as boolean}
                onChange={(e) => handleChange(field.key, e.target.checked)}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.key}
                value={config[field.key] as string}
                onChange={(e) => handleChange(field.key, e.target.value)}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'number' ? (
              <input
                id={field.key}
                type="number"
                value={config[field.key] as number}
                onChange={(e) => handleChange(field.key, parseFloat(e.target.value) || 0)}
                min={field.min}
                max={field.max}
                step={field.step}
              />
            ) : (
              <input
                id={field.key}
                type="color"
                value={config[field.key] as string}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

