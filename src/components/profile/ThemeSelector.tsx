import { Palette, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import type { ThemeDefinition } from '../../config/themes';

interface ThemeSelectorProps {
  currentTheme: ThemeDefinition;
  themes: ThemeDefinition[];
  setTheme: (id: string) => void;
}

export function ThemeSelector({ currentTheme, themes, setTheme }: ThemeSelectorProps) {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <Palette size={20} className="text-primary" />
        <div>
          <h3 className="text-sm font-bold text-text-primary">Tema</h3>
          <p className="text-xs text-text-muted">Personalizá los colores</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((t) => {
          const isActive = currentTheme.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-xl border transition-all text-left',
                isActive
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border hover:bg-surface-hover'
              )}
            >
              <span
                className="w-5 h-5 rounded-full shrink-0 border border-white/20 shadow-sm"
                style={{ background: t.colors['--color-primary'] }}
              />
              <span className="text-xs font-medium text-text-primary truncate">{t.name}</span>
              {isActive && <Check size={14} className="text-primary ml-auto shrink-0" />}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
