import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { HabitList } from '../components/habits/HabitList';
import { HabitWeekView } from '../components/habits/HabitWeekView';
import { HabitMonthCombined } from '../components/habits/HabitMonthCombined';
import { HabitForm } from '../components/habits/HabitForm';
import { HabitGenerator } from '../components/habits/HabitGenerator';
import { HabitStats } from '../components/habits/HabitStats';
import { HabitTrendChart } from '../components/habits/HabitTrendChart';
import { PartnerComparison } from '../components/habits/PartnerComparison';
import type { Habit } from '../types/habit';
const TABS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'stats', label: 'Stats' },
];

export function HabitsPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [showForm, setShowForm] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { user, profile } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const {
    myHabits,
    myArchivedHabits,
    todayHabits,
    todayLogs,
    partnerTodayLogs,
    loading,
    toggle,
    addCustomHabit,
    removeHabit,
    restoreHabit,
    editHabit,
    getLogsForHabit,
    getStatsData,
  } = useHabits();
  const { streaks, bestStreak } = useStreaks();

  const userId = user?.uid;
  const soundEnabled = profile?.settings?.soundEnabled ?? true;

  function handleEdit(habitId: string) {
    const habit = myHabits.find((h) => h.id === habitId);
    if (habit) {
      setEditingHabit(habit);
      setShowForm(true);
    }
  }

  function handleDelete(habitId: string) {
    removeHabit(habitId);
  }

  function handleFormSubmit(data: Parameters<typeof addCustomHabit>[0]) {
    if (editingHabit) {
      editHabit(editingHabit.id, data);
    } else {
      addCustomHabit(data);
    }
    setEditingHabit(null);
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  // Empty state - no habits yet
  if (myHabits.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={<Plus size={48} />}
          title="¡Empezá con tus hábitos!"
          description="Creá tu primer hábito para comenzar a trackear tu progreso."
          action={
            <div className="flex flex-col gap-2 items-center">
              <Button onClick={() => setShowForm(true)} size="lg">
                <Plus size={18} />
                Crear hábito
              </Button>
              <button
                onClick={() => setShowGenerator(true)}
                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity"
              >
                <Sparkles size={14} />
                Sugerí hábitos con IA
              </button>
            </div>
          }
        />
        <HabitForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingHabit(null); }}
          onSubmit={handleFormSubmit}
        />
        <HabitGenerator
          open={showGenerator}
          onClose={() => setShowGenerator(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === 'today' && (
          <motion.div
            key="today"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <HabitList
              title="Mis habitos"
              habits={todayHabits}
              logs={todayLogs}
              streaks={streaks}
              onToggle={(habitId, completed, value, metGoal) => toggle(habitId, completed, value, metGoal)}
              partnerLogs={partnerTodayLogs}
              partnerName={partnerName}
              currentUserId={userId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              soundEnabled={soundEnabled}
            />

            {myArchivedHabits.length > 0 && (
              <div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1 hover:text-text-secondary transition-colors"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showArchived ? 'rotate-0' : '-rotate-90'}`}
                  />
                  Archivados ({myArchivedHabits.length})
                </button>
                {showArchived && (
                  <div className="space-y-2">
                    {myArchivedHabits.map((habit) => (
                      <div
                        key={habit.id}
                        className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 opacity-60"
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: habit.color }}
                        />
                        <p className="flex-1 text-sm text-text-primary">{habit.name}</p>
                        <button
                          onClick={() => restoreHabit(habit.id)}
                          className="shrink-0 w-8 h-8 rounded-lg bg-surface-hover text-text-muted hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                          title="Restaurar hábito"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'week' && (
          <motion.div
            key="week"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {myHabits.map((habit) => {
              const habitLogs = getLogsForHabit(habit.id, userId);
              return (
                <div key={habit.id} className="bg-surface rounded-2xl border border-border p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                    <h3 className="text-sm font-semibold text-text-primary">{habit.name}</h3>
                  </div>
                  <HabitWeekView logs={habitLogs} color={habit.color} />
                </div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'month' && (
          <motion.div
            key="month"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <HabitMonthCombined
              habits={myHabits}
              getLogsForHabit={getLogsForHabit}
              userId={userId}
            />
          </motion.div>
        )}

        {activeTab === 'stats' && (() => {
          const statsData = getStatsData();
          // Get current/longest streak from useStreaks
          const currentStreak = bestStreak?.currentStreak || 0;
          const longestStreak = streaks.reduce((max, s) => Math.max(max, s.longestStreak), 0);
          // Partner weekly percent from dailyData
          const partnerWeeklyTotal = statsData.dailyData.slice(-7);
          const partnerWeeklyPercent = partnerWeeklyTotal.length > 0
            ? Math.round(partnerWeeklyTotal.reduce((sum, d) => sum + d.partnerPercent, 0) / partnerWeeklyTotal.length)
            : 0;

          return (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <HabitStats
                stats={{
                  ...statsData,
                  currentStreak,
                  longestStreak,
                }}
              />
              <HabitTrendChart data={statsData.dailyData} />
              <PartnerComparison
                myPercent={statsData.weeklyPercent}
                partnerPercent={partnerWeeklyPercent}
                partnerName={partnerName}
              />
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* FAB principal — portalled to body */}
      {createPortal(
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-28 right-4 w-14 h-14 rounded-full bg-gradient-to-b from-primary to-emerald-600 text-white shadow-lg shadow-primary/40 flex items-center justify-center z-30 hover:from-primary-hover hover:to-emerald-700 transition-colors active:scale-90"
        >
          <Plus size={24} />
        </button>,
        document.body
      )}

      {/* FAB IA Sparkles — encima del principal */}
      {createPortal(
        <button
          onClick={() => setShowGenerator(true)}
          className="fixed bottom-44 right-4 w-12 h-12 rounded-full bg-surface border border-primary/30 text-primary shadow-md flex items-center justify-center z-30 hover:bg-primary/10 transition-colors active:scale-90"
          title="Generar hábitos con IA"
        >
          <Sparkles size={20} />
        </button>,
        document.body
      )}

      <HabitForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingHabit(null); }}
        onSubmit={handleFormSubmit}
        editingHabit={editingHabit || undefined}
      />

      <HabitGenerator
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
      />
    </div>
  );
}
