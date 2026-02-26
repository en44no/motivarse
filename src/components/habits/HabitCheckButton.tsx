import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HabitCheckButtonProps {
  completed: boolean;
  color: string;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export function HabitCheckButton({ completed, color, onToggle, size = 'md' }: HabitCheckButtonProps) {
  const sizes = size === 'sm' ? 'w-8 h-8' : 'w-11 h-11';
  const iconSize = size === 'sm' ? 16 : 22;

  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.85 }}
      className={cn(
        'relative rounded-full flex items-center justify-center transition-all duration-300 shrink-0',
        sizes,
        completed
          ? 'shadow-lg'
          : 'border-2 border-border hover:border-text-muted hover:ring-2 hover:ring-primary/20'
      )}
      style={completed ? { backgroundColor: color, boxShadow: `0 0 24px ${color}50` } : {}}
    >
      {completed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          <Check size={iconSize} className="text-white" strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
}
