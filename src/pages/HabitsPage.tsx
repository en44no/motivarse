import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import type { Habit } from '../types/habit';
const TABS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

export function HabitsPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { user, profile } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const {
    myHabits,
    todayHabits,
    todayLogs,
    partnerTodayLogs,
    loading,
    toggle,
    addCustomHabit,
    removeHabit,
    editHabit,
    getLogsForHabit,
  } = useHabits();
  const { streaks } = useStreaks();

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
            <Button onClick={() => setShowForm(true)} size="lg">
              <Plus size={18} />
              Crear hábito
            </Button>
          }
        />
        <HabitForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingHabit(null); }}
          onSubmit={handleFormSubmit}
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
            className="space-y-4"
          >
            {myHabits.map((habit) => {
              const habitLogs = getLogsForHabit(habit.id, userId);
              return (
                <div key={habit.id} className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
                  <HabitMonthView logs={habitLogs} color={habit.color} habitName={habit.name} />
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-28 right-4 w-14 h-14 rounded-full bg-gradient-to-b from-primary to-emerald-600 text-white shadow-lg shadow-primary/40 flex items-center justify-center z-30 hover:from-primary-hover hover:to-emerald-700 transition-colors active:scale-90"
      >
        <Plus size={24} />
      </button>

      <HabitForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingHabit(null); }}
        onSubmit={handleFormSubmit}
        editingHabit={editingHabit || undefined}
      />
    </div>
  );
}
