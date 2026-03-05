import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else {
      return;
    }
    const nextTab = tabs[nextIndex];
    onChange(nextTab.id);
    tabsRef.current[nextIndex]?.focus();
  }, [tabs, onChange]);

  return (
    <div role="tablist" className={cn('flex gap-1 p-1 bg-surface rounded-xl backdrop-blur-sm border border-border/50', className)}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => { tabsRef.current[index] = el; }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors duration-200',
              isActive
                ? 'text-[#052e16]'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-lg bg-gradient-to-b from-primary to-primary-hover shadow-[var(--shadow-glow-primary)]"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
