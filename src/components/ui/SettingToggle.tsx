import type { ReactNode, KeyboardEvent } from 'react';
import { Card } from './Card';

interface SettingToggleProps {
  icon: ReactNode;
  /** Icono alternativo cuando el toggle esta apagado. Si no se pasa, reusa `icon`. */
  iconOff?: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

export function SettingToggle({
  icon,
  iconOff,
  title,
  description,
  enabled,
  onToggle,
}: SettingToggleProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  const displayIcon = enabled ? icon : (iconOff ?? icon);

  return (
    <Card variant="interactive" onClick={onToggle}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-light">
          {displayIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
        <div
          role="switch"
          aria-checked={enabled}
          aria-label={title}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
            enabled ? 'bg-primary' : 'bg-surface-light'
          }`}
        >
          <div
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
            }`}
          />
        </div>
      </div>
    </Card>
  );
}
