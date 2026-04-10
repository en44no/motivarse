import { memo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/date-utils';
import { useDensity } from '../../contexts/DensityContext';
import type { WishlistItem as WishlistItemType } from '../../types/wishlist';
import type { CoupleCategory } from '../../types/category';

interface WishlistItemProps {
  item: WishlistItemType;
  categories: CoupleCategory[];
  onToggle: (completed: boolean) => void;
  onDelete: () => void;
  memberNames: Record<string, string>;
}

export const WishlistItem = memo(function WishlistItem({
  item,
  categories,
  onToggle,
  onDelete,
  memberNames,
}: WishlistItemProps) {
  const { isCompact } = useDensity();

  const categoryDef = item.category ? categories.find((c) => c.id === item.category) : undefined;
  const createdByName = memberNames[item.createdBy] || 'Alguien';
  const completedByName = item.completedBy
    ? memberNames[item.completedBy] || 'Alguien'
    : '';

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0]);
  const deleteScale = useTransform(x, [-100, -60], [1, 0.8]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 bg-danger flex items-center justify-end pr-5 rounded-xl"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div style={{ scale: deleteScale }} className="flex items-center gap-1.5 text-white">
          <Trash2 size={16} />
          <span className="text-xs font-semibold">Eliminar</span>
        </motion.div>
      </motion.div>

      {/* Card content */}
      <motion.div
        className={cn(
          'flex items-center gap-3 bg-surface rounded-xl border border-border/60 shadow-sm relative',
          isCompact ? 'p-3' : 'p-4',
          item.completed && 'opacity-60',
        )}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) {
            onDelete();
          }
        }}
      >
        <button
          onClick={() => onToggle(!item.completed)}
          className={cn(
            'rounded-full flex items-center justify-center shrink-0 transition-colors',
            isCompact ? 'w-7 h-7' : 'w-8 h-8',
            item.completed
              ? 'bg-primary text-primary-contrast'
              : 'border-2 border-border hover:border-primary/50',
          )}
          aria-label={item.completed ? 'Desmarcar deseo' : 'Completar deseo'}
          role="checkbox"
          aria-checked={item.completed}
        >
          {item.completed && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categoryDef && <span className="text-sm leading-none">{categoryDef.emoji}</span>}
            <p
              className={cn(
                'text-sm font-semibold',
                item.completed
                  ? 'text-text-muted line-through'
                  : 'text-text-primary',
              )}
            >
              {item.title}
            </p>
          </div>

          {!isCompact && item.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          {!isCompact && (
            <p className="text-2xs text-text-muted mt-1">
              {item.completed
                ? `Completado por ${completedByName}${item.completedAt ? ` \u00B7 ${formatRelativeTime(item.completedAt)}` : ''}`
                : `Agregado por ${createdByName} \u00B7 ${formatRelativeTime(item.createdAt)}`}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});
