import type { ReactNode, KeyboardEvent } from 'react';
import { Card } from './Card';

interface SettingToggleProps {
  icon: ReactNode;
  iconOff: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

export function SettingToggle({ icon, iconOff, title, description, enabled, onToggle }: SettingToggleProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <Card variant="interactive" onClick={onToggle}>
      <div className="flex items-center gap-3">
        {enabled ? icon : iconOff}
        <div className="flex-1">
          <h3 className="text-sm font-bold text-text-primary">{title}</h3>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
        <div
          role="switch"
          aria-checked={enabled}
          aria-label={title}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-surface-light'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
        </div>
      </div>
    </Card>
  );
}
