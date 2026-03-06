export type HabitType = 'boolean' | 'time' | 'water';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';
export type HabitCategory = 'sleep' | 'health' | 'productivity' | 'fitness' | 'custom';

export type HabitScope = 'individual' | 'shared';
export type HabitCompletionMode = 'any' | 'both';

export interface Habit {
  id: string;
  userId: string;
  coupleId: string;
  name: string;
  type: HabitType;
  category: HabitCategory;
  icon: string;
  color: string;
  isPreset: boolean;
  frequency: HabitFrequency;
  customDays?: number[]; // 0=Sun, 1=Mon...6=Sat
  goal?: {
    targetTime?: string; // "HH:mm" format
    comparison?: 'before' | 'after';
  };
  scope: HabitScope;
  completionMode?: HabitCompletionMode; // only for shared habits
  isActive: boolean;
  reminder?: { enabled: boolean; time: string }; // time in "HH:mm"
  order: number;
  createdAt: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  coupleId: string;
  date: string; // "YYYY-MM-DD"
  completed: boolean;
  value?: string; // time value "HH:mm"
  metGoal?: boolean;
  note?: string;
  completedAt: number;
}

export interface HabitStreak {
  habitId: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}
