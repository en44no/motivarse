import { Palette, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ThemeDefinition } from '../../config/themes';

interface ThemeSelectorProps {
  currentTheme: ThemeDefinition;
  themes: ThemeDefinition[];
  setTheme: (id: string) => void;
}

export function ThemeSelector({ currentTheme, themes, setTheme }: ThemeSelectorProps) {
  return (
    <section
      className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm"
      aria-label="Selector de tema"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft ring-1 ring-accent/20">
          <Palette size={18} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary">Tema</h3>
          <p className="text-xs text-text-muted">
            {currentTheme.name} · Personalizá los colores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {themes.map((t) => {
          const isActive = currentTheme.id === t.id;
          const primary = t.colors['--color-primary'];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={isActive}
              aria-label={`Activar tema ${t.name}`}
              className={cn(
                'group relative flex min-h-11 flex-col items-start gap-2 rounded-xl border p-2.5 text-left transition-all duration-150',
                isActive
                  ? 'border-primary/60 bg-primary-soft/30 ring-1 ring-primary/30'
                  : 'border-border/60 bg-surface-hover/40 hover:border-border-light hover:bg-surface-hover',
              )}
            >
              {/* Color preview: tres puntitos representando surface/primary */}
              <div className="flex items-center gap-1">
                <span
                  className="h-4 w-4 rounded-full border border-white/10 shadow-sm"
                  style={{ backgroundColor: primary }}
                  aria-hidden="true"
                />
                <span
                  className="h-3 w-3 rounded-full border border-white/10 opacity-80"
                  style={{ backgroundColor: primary, filter: 'brightness(0.75)' }}
                  aria-hidden="true"
                />
                <span
                  className="h-2 w-2 rounded-full border border-white/10 opacity-60"
                  style={{ backgroundColor: primary, filter: 'brightness(0.5)' }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex w-full items-center justify-between gap-1">
                <span
                  className={cn(
                    'truncate text-xs font-semibold',
                    isActive ? 'text-primary' : 'text-text-primary',
                  )}
                >
                  {t.name}
                </span>
                {isActive && (
                  <Check size={14} className="shrink-0 text-primary" strokeWidth={2.5} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
