import { useState, useMemo, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Repeat, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/currency-utils';
import { isPaidThisMonth, getCurrentYearMonth } from '../../hooks/useRecurringPayments';
import type {
  Expense,
  ExpenseCard,
  ExpenseCategory,
  RecurringPayment,
} from '../../types/expense';

interface ExpensesCalendarProps {
  expenses: Expense[];
  recurringPayments: RecurringPayment[];
  cards: ExpenseCard[];
  categories: ExpenseCategory[];
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type DotStatus = 'paid' | 'overdue' | 'soon' | 'future';

interface RecurringDayEntry {
  kind: 'recurring';
  id: string;
  name: string;
  amount: number;
  currency: RecurringPayment['currency'];
  status: DotStatus;
  card?: string;
  category?: string;
}

interface ExpenseDayEntry {
  kind: 'expense';
  id: string;
  name: string;
  amount: number;
  currency: Expense['currency'];
  card?: string;
  category?: string;
}

type DayEntry = RecurringDayEntry | ExpenseDayEntry;

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function computeRecurringStatus(
  rp: RecurringPayment,
  monthYear: number,
  monthMonth: number,
  today: Date,
): DotStatus {
  const visibleMonthKey = `${monthYear}-${String(monthMonth + 1).padStart(2, '0')}`;
  if (isPaidThisMonth(rp, visibleMonthKey)) return 'paid';

  const maxDay = daysInMonth(monthYear, monthMonth);
  const actualDay = Math.min(rp.dayOfMonth, maxDay);
  const dueDate = new Date(monthYear, monthMonth, actualDay);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = dueDate.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'soon';
  return 'future';
}

const STATUS_DOT_CLASS: Record<DotStatus, string> = {
  paid: 'bg-primary',
  overdue: 'bg-danger',
  soon: 'bg-warning',
  future: 'bg-text-muted',
};

const STATUS_LABEL: Record<DotStatus, string> = {
  paid: 'Pagado',
  overdue: 'Vencido',
  soon: 'Proximo',
  future: 'Pendiente',
};

export function ExpensesCalendar({
  expenses,
  recurringPayments,
  cards,
  categories,
}: ExpensesCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());

  const isCurrentOrFutureMonth = useMemo(() => {
    const now = new Date();
    return (
      currentMonth.getFullYear() > now.getFullYear() ||
      (currentMonth.getFullYear() === now.getFullYear() &&
        currentMonth.getMonth() >= now.getMonth())
    );
  }, [currentMonth]);

  const goToPrevMonth = useCallback(() => {
    setDirection(-1);
    setCurrentMonth((m) => subMonths(m, 1));
    setSelectedDate(null);
  }, []);

  const goToNextMonth = useCallback(() => {
    setDirection(1);
    setCurrentMonth((m) => addMonths(m, 1));
    setSelectedDate(null);
  }, []);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const offset = useMemo(() => {
    const startDay = getDay(startOfMonth(currentMonth));
    return startDay === 0 ? 6 : startDay - 1;
  }, [currentMonth]);

  const monthLabel = useMemo(
    () => format(currentMonth, 'MMMM yyyy', { locale: es }),
    [currentMonth],
  );

  // Build map of day entries for the visible month
  const dayMap = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Recurring payments for the visible month
    for (const rp of recurringPayments) {
      if (!rp.isActive) continue;
      const maxDay = daysInMonth(year, month);
      const actualDay = Math.min(rp.dayOfMonth, maxDay);
      const key = dayKey(year, month, actualDay);
      const status = computeRecurringStatus(rp, year, month, today);
      const entry: RecurringDayEntry = {
        kind: 'recurring',
        id: rp.id,
        name: rp.name,
        amount: rp.suggestedAmount,
        currency: rp.currency,
        status,
        card: rp.card,
        category: rp.category,
      };
      const existing = map.get(key);
      if (existing) existing.push(entry);
      else map.set(key, [entry]);
    }

    // Expenses created during the visible month (as "added that day" indicator)
    for (const expense of expenses) {
      const d = new Date(expense.createdAt);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const key = dayKey(year, month, d.getDate());
      const entry: ExpenseDayEntry = {
        kind: 'expense',
        id: expense.id,
        name: expense.name,
        amount: expense.installmentPrice,
        currency: expense.currency,
        card: expense.card,
        category: expense.category,
      };
      const existing = map.get(key);
      if (existing) existing.push(entry);
      else map.set(key, [entry]);
    }

    return map;
  }, [currentMonth, recurringPayments, expenses, today]);

  const selectedEntries = selectedDate ? dayMap.get(selectedDate) || [] : [];
  const selectedLabel = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  }, [selectedDate]);

  return (
    <div className="space-y-3">
      {/* Calendar card */}
      <div className="bg-surface rounded-2xl border border-border/60 p-4 shadow-sm space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-base font-semibold text-text-primary capitalize">
            {monthLabel}
          </h3>
          <button
            onClick={goToNextMonth}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day names row */}
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((d, i) => (
            <div
              key={`${d}-${i}`}
              className="text-center text-2xs text-text-muted font-medium py-0.5"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid with slide animation */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={monthLabel}
              custom={direction}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="grid grid-cols-7 gap-1"
            >
              {/* Empty cells for offset */}
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {days.map((day) => {
                const key = dayKey(
                  day.getFullYear(),
                  day.getMonth(),
                  day.getDate(),
                );
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const entries = dayMap.get(key) || [];
                const inCurrentMonth = isSameMonth(day, currentMonth);

                // Collect unique dot statuses for recurring items (max 3)
                const statusSet = new Set<DotStatus>();
                let hasExpense = false;
                for (const entry of entries) {
                  if (entry.kind === 'recurring') statusSet.add(entry.status);
                  else hasExpense = true;
                }
                const statuses = Array.from(statusSet).slice(0, 3);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setSelectedDate((prev) => (prev === key ? null : key))
                    }
                    className={cn(
                      'aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all relative',
                      'cursor-pointer active:scale-90',
                      isSelected && 'ring-2 ring-primary bg-primary/10',
                      !isSelected && isToday && 'ring-1 ring-primary/50',
                      !isSelected &&
                        !isToday &&
                        'hover:bg-surface-hover',
                      !inCurrentMonth && 'opacity-40',
                    )}
                  >
                    <span
                      className={cn(
                        'text-2xs font-medium leading-none tabular-nums',
                        isSelected
                          ? 'text-primary font-bold'
                          : isToday
                            ? 'text-text-primary font-bold'
                            : 'text-text-muted',
                      )}
                    >
                      {day.getDate()}
                    </span>

                    {/* Indicators row */}
                    {(statuses.length > 0 || hasExpense) && (
                      <div className="flex items-center gap-px justify-center">
                        {statuses.map((s) => (
                          <div
                            key={s}
                            className={cn(
                              'w-[5px] h-[5px] rounded-full',
                              STATUS_DOT_CLASS[s],
                            )}
                          />
                        ))}
                        {hasExpense && statuses.length === 0 && (
                          <div className="w-[5px] h-[5px] rounded-full bg-secondary" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-border/60">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-2xs text-text-muted">Pagado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="text-2xs text-text-muted">Próximo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-danger" />
            <span className="text-2xs text-text-muted">Vencido</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
            <span className="text-2xs text-text-muted">Pendiente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span className="text-2xs text-text-muted">Gasto</span>
          </div>
        </div>
      </div>

      {/* Day detail panel */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-surface rounded-2xl border border-border/60 p-4 shadow-sm space-y-3">
              <h4 className="text-2xs font-semibold text-text-muted uppercase tracking-wider capitalize">
                {selectedLabel}
              </h4>

              {selectedEntries.length === 0 ? (
                <p className="text-xs text-text-muted">Sin eventos este día</p>
              ) : (
                <div className="space-y-2">
                  {selectedEntries.map((entry) => {
                    const card = entry.card
                      ? cards.find((c) => c.id === entry.card)
                      : undefined;
                    const category = entry.category
                      ? categories.find((c) => c.id === entry.category)
                      : undefined;

                    if (entry.kind === 'recurring') {
                      return (
                        <div
                          key={`rec-${entry.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-light border border-border/60"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-surface">
                            <Repeat size={14} className="text-text-secondary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {category && (
                                <span className="text-xs">{category.emoji}</span>
                              )}
                              <p className="text-sm font-semibold text-text-primary truncate">
                                {entry.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-1">
                                <div
                                  className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    STATUS_DOT_CLASS[entry.status],
                                  )}
                                />
                                <span className="text-2xs text-text-muted">
                                  {STATUS_LABEL[entry.status]}
                                </span>
                              </div>
                              {card && (
                                <span className="text-2xs text-text-muted truncate">
                                  {card.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-text-primary shrink-0 tabular-nums">
                            {formatCurrency(entry.amount, entry.currency)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`exp-${entry.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-light border border-border/60"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-surface">
                          <Wallet size={14} className="text-text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {category && (
                              <span className="text-xs">{category.emoji}</span>
                            )}
                            <p className="text-sm font-semibold text-text-primary truncate">
                              {entry.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-2xs text-text-muted">
                              Gasto agregado
                            </span>
                            {card && (
                              <span className="text-2xs text-text-muted truncate">
                                {card.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-text-primary shrink-0 tabular-nums">
                          {formatCurrency(entry.amount, entry.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help text when in future months */}
      {!isCurrentOrFutureMonth && (
        <p className="text-2xs text-text-muted text-center">
          Mostrando mes pasado
        </p>
      )}
    </div>
  );
}
