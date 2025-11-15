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

  // Create a unique prefix for this section based on title
  // Convert title to a safe ID format (lowercase, replace spaces with hyphens)
  const sectionIdPrefix = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (
    <div className="config-section">
      <h3 className="section-title">{title}</h3>
      {description && (
        <p className="section-description">{description}</p>
      )}
      <div className="section-fields">
        {fields.map((field) => {
          // Create unique ID by combining section prefix with field key
          const uniqueId = `${sectionIdPrefix}-${field.key}`;
          
          return (
            <div key={field.key} className="field">
              <label htmlFor={uniqueId}>
                {field.label}
                {field.tooltip && (
                  <Tooltip content={field.tooltip}>
                    <span className="tooltip-icon">ℹ️</span>
                  </Tooltip>
                )}
              </label>
              {field.type === 'checkbox' ? (
                <input
                  id={uniqueId}
                  type="checkbox"
                  checked={config[field.key] as boolean}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                />
              ) : field.type === 'select' ? (
                <select
                  id={uniqueId}
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
                  id={uniqueId}
                  type="number"
                  value={config[field.key] as number}
                  onChange={(e) => handleChange(field.key, parseFloat(e.target.value) || 0)}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                />
              ) : (
                <input
                  id={uniqueId}
                  type="color"
                  value={config[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

