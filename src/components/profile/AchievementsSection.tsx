import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_CATEGORY_LABELS } from '../../config/constants';
import { getProgress, useAchievements } from '../../hooks/useAchievements';
import type {
  AchievementDef,
  AchievementCategory,
  Achievement,
} from '../../types/shared';

interface AchievementsSectionProps {
  showAchievements: boolean;
  setShowAchievements: (v: boolean) => void;
  unlockedAchievements: Achievement[];
  evalCtx: ReturnType<typeof useAchievements>['evalCtx'];
  selectedAchievement: AchievementDef | null;
  setSelectedAchievement: (v: AchievementDef | null) => void;
}

export function AchievementsSection({
  showAchievements,
  setShowAchievements,
  unlockedAchievements,
  evalCtx,
  setSelectedAchievement,
}: AchievementsSectionProps) {
  const unlockedIds = useMemo(
    () => new Set(unlockedAchievements.map((a) => a.achievementId)),
    [unlockedAchievements],
  );
  const unlockedCount = unlockedIds.size;
  const totalCount = ACHIEVEMENT_DEFINITIONS.length;
  const pct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<AchievementCategory, AchievementDef[]>();
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const list = map.get(def.category) || [];
      list.push(def);
      map.set(def.category, list);
    }
    return map;
  }, []);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm"
      aria-label="Logros"
    >
      <button
        type="button"
        onClick={() => setShowAchievements(!showAchievements)}
        aria-expanded={showAchievements}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors duration-150 hover:bg-surface-hover"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft ring-1 ring-accent/20">
            <Trophy size={18} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">Logros</p>
            <p className="text-xs text-text-muted">
              <span className="tabular-nums">{unlockedCount}</span>
              <span> de </span>
              <span className="tabular-nums">{totalCount}</span>
              <span> desbloqueados</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-bold tabular-nums text-accent">
            {Math.round(pct)}%
          </span>
          <ChevronDown
            size={18}
            className={cn(
              'text-text-muted transition-transform duration-200',
              showAchievements && 'rotate-180',
            )}
          />
        </div>
      </button>

      {showAchievements && (
        <div className="space-y-5 border-t border-border/60 px-4 py-4">
          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-light">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          {/* Grid by category */}
          {Array.from(grouped.entries()).map(([category, defs]) => {
            const categoryUnlocked = defs.filter((d) => unlockedIds.has(d.id)).length;
            return (
              <div key={category}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
                    {ACHIEVEMENT_CATEGORY_LABELS[category] || category}
                  </p>
                  <p className="text-2xs font-semibold tabular-nums text-text-muted">
                    {categoryUnlocked}/{defs.length}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {defs.map((def) => {
                    const isUnlocked = unlockedIds.has(def.id);
                    const progress = getProgress(def.condition, evalCtx);
                    return (
                      <button
                        key={def.id}
                        type="button"
                        onClick={() => setSelectedAchievement(def)}
                        aria-label={isUnlocked ? def.name : 'Logro bloqueado'}
                        className={cn(
                          'group relative flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all duration-150',
                          isUnlocked
                            ? 'border-primary/30 bg-primary-soft/30 hover:border-primary/50 hover:bg-primary-soft/40'
                            : 'border-border/50 bg-surface-light/30 opacity-70 hover:opacity-90',
                        )}
                      >
                        <span
                          className={cn(
                            'text-2xl leading-none',
                            !isUnlocked && 'grayscale',
                          )}
                          aria-hidden="true"
                        >
                          {isUnlocked ? def.icon : '?'}
                        </span>
                        <span className="line-clamp-2 text-center text-2xs font-medium leading-tight text-text-primary">
                          {isUnlocked ? def.name : '???'}
                        </span>
                        {!isUnlocked && progress !== null && progress > 0 && (
                          <div
                            className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-surface-light"
                            aria-hidden="true"
                          >
                            <div
                              className="h-full rounded-full bg-primary/60"
                              style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
