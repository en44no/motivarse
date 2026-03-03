import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subDays, addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useDataContext } from '../contexts/DataContext';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { HabitList } from '../components/habits/HabitList';
import { HabitWeekView } from '../components/habits/HabitWeekView';
import { UnifiedCalendar } from '../components/habits/UnifiedCalendar';
import { HabitForm } from '../components/habits/HabitForm';
import { HabitGenerator } from '../components/habits/HabitGenerator';
import { HabitStats } from '../components/habits/HabitStats';
import { HabitTrendChart } from '../components/habits/HabitTrendChart';
import { PartnerComparison } from '../components/habits/PartnerComparison';
import { StreakHistory } from '../components/habits/StreakHistory';
import { isHabitScheduledForDate } from '../lib/date-utils';
import { getToday, formatDate } from '../lib/date-utils';
import type { Habit } from '../types/habit';

const MAX_DAYS_BACK = 7;

const TABS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Calendario' },
  { id: 'stats', label: 'Stats' },
];

export function HabitsPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [showForm, setShowForm] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { user, profile } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const { habitLogs, runLogs, todos } = useDataContext();
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
    getLogsForDate,
    statsData,
  } = useHabits();
  const { streaks, bestStreak } = useStreaks();

  const userId = user?.uid;
  const soundEnabled = profile?.settings?.soundEnabled ?? true;

  // Date navigation for "Hoy" tab
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;

  const canGoBack = (() => {
    const diff = Math.round((parseISO(today).getTime() - parseISO(selectedDate).getTime()) / (1000 * 60 * 60 * 24));
    return diff < MAX_DAYS_BACK;
  })();
  const canGoForward = !isToday;

  function goBack() {
    if (!canGoBack) return;
    setSelectedDate(formatDate(subDays(parseISO(selectedDate), 1)));
  }
  function goForward() {
    if (!canGoForward) return;
    setSelectedDate(formatDate(addDays(parseISO(selectedDate), 1)));
  }
  function goToToday() {
    setSelectedDate(today);
  }

  // Habits and logs for the selected date
  const selectedDateObj = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const selectedHabits = useMemo(
    () => isToday ? todayHabits : myHabits.filter((h) => isHabitScheduledForDate(h, selectedDateObj)),
    [isToday, todayHabits, myHabits, selectedDateObj]
  );
  const selectedLogs = useMemo(
    () => isToday ? todayLogs : getLogsForDate(selectedDate),
    [isToday, todayLogs, selectedDate, getLogsForDate]
  );
  const selectedPartnerLogs = useMemo(
    () => isToday ? partnerTodayLogs : selectedLogs.filter((l) => l.userId !== userId),
    [isToday, partnerTodayLogs, selectedLogs, userId]
  );

  const dateLabel = useMemo(() => {
    if (isToday) return 'Hoy';
    const d = parseISO(selectedDate);
    const diff = Math.round((parseISO(today).getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) return 'Ayer';
    return format(d, "EEEE d 'de' MMMM", { locale: es });
  }, [selectedDate, isToday, today]);

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
            className="space-y-4"
          >
            {/* Date navigator */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={goBack}
                disabled={!canGoBack}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToToday}
                className="text-sm font-semibold text-text-primary px-3 py-1 rounded-lg hover:bg-surface-hover transition-colors capitalize"
              >
                {dateLabel}
              </button>
              <button
                onClick={goForward}
                disabled={!canGoForward}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <HabitList
              title={isToday ? 'Mis hábitos' : undefined}
              habits={selectedHabits}
              logs={selectedLogs}
              streaks={streaks}
              onToggle={(habitId, completed, value, metGoal) => toggle(habitId, completed, value, metGoal, isToday ? undefined : selectedDate)}
              partnerLogs={selectedPartnerLogs}
              partnerName={partnerName}
              currentUserId={userId}
              onEdit={isToday ? handleEdit : undefined}
              onDelete={isToday ? handleDelete : undefined}
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
          >
            <UnifiedCalendar
              habits={myHabits}
              habitLogs={habitLogs}
              runLogs={runLogs}
              todos={todos}
              userId={userId}
            />
          </motion.div>
        )}

        {activeTab === 'stats' && (() => {
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
              <StreakHistory
                habits={myHabits}
                logs={habitLogs}
                userId={userId}
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
