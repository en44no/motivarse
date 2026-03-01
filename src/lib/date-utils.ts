import { format, isToday, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval, subDays, differenceInDays, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Habit } from '../types/habit';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM', { locale: es });
}

export function formatDayName(date: Date): string {
  return format(date, 'EEE', { locale: es });
}

export function formatTime(time: string): string {
  return time;
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getWeekDays(date?: Date): Date[] {
  const ref = date || new Date();
  const start = startOfWeek(ref, { weekStartsOn: 1 });
  const end = endOfWeek(ref, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getLast7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
}

export function daysBetween(date1: string, date2: string): number {
  return differenceInDays(parseISO(date1), parseISO(date2));
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/**
 * Check if a habit is scheduled for a given date based on its frequency.
 * getDay() returns 0=Sun, 1=Mon...6=Sat
 */
export function isHabitScheduledForDate(habit: Habit, date: Date = new Date()): boolean {
  const dayOfWeek = getDay(date); // 0=Sun, 1=Mon...6=Sat
  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      return habit.customDays?.includes(dayOfWeek) ?? true;
    default:
      return true;
  }
}

/**
 * Format a timestamp to relative time in Spanish: "hace 5 min", "hace 2h", etc.
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} dias`;
  return formatShortDate(new Date(timestamp));
}
