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
  return (
    <div className={cn('flex gap-1 p-1 bg-surface rounded-xl backdrop-blur-sm border border-border/50', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors duration-200',
            activeTab === tab.id
              ? 'text-white'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-lg bg-gradient-to-b from-primary to-emerald-600 shadow-[0_2px_8px_rgba(34,197,94,0.3)]"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
