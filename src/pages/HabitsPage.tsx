import { useState, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
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
import { HabitMonthView } from '../components/habits/HabitMonthView';
import { HabitForm } from '../components/habits/HabitForm';
import { getToday } from '../lib/date-utils';

const TABS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

export function HabitsPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const {
    myHabits,
    logs,
    todayLogs,
    partnerTodayLogs,
    loading,
    toggle,
    addPresetHabits,
    addCustomHabit,
    getLogsForHabit,
  } = useHabits();
  const { streaks, getStreak } = useStreaks();

  const today = getToday();
  const userId = user?.uid;

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
          icon={<Sparkles size={48} />}
          title="¡Empezá con tus hábitos!"
          description="Cargá los hábitos predefinidos para comenzar a trackear."
          action={
            <Button onClick={addPresetHabits} size="lg">
              <Sparkles size={18} />
              Cargar hábitos iniciales
            </Button>
          }
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
              title="Mis hábitos"
              habits={myHabits}
              logs={todayLogs}
              streaks={streaks}
              onToggle={(habitId, completed, value, metGoal) => toggle(habitId, completed, value, metGoal)}
              partnerLogs={partnerTodayLogs}
              partnerName={partnerName}
              currentUserId={userId}
            />
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
                <div key={habit.id} className="bg-surface rounded-2xl border border-border p-4 space-y-3">
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
            className="space-y-4"
          >
            {myHabits.map((habit) => {
              const habitLogs = getLogsForHabit(habit.id, userId);
              return (
                <div key={habit.id} className="bg-surface rounded-2xl border border-border p-4">
                  <HabitMonthView logs={habitLogs} color={habit.color} habitName={habit.name} />
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center z-30 hover:bg-primary-hover transition-colors"
      >
        <Plus size={24} />
      </motion.button>

      <HabitForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={addCustomHabit}
      />
    </div>
  );
}
