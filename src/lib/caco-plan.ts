import type { CacoWeek } from '../types/running';

export const CACO_PLAN: CacoWeek[] = [
  { week: 1, runMinutes: 1, walkMinutes: 4, repetitions: 6, totalMinutes: 30, description: '1 min corriendo + 4 min caminando × 6' },
  { week: 2, runMinutes: 1, walkMinutes: 4, repetitions: 7, totalMinutes: 35, description: '1 min corriendo + 4 min caminando × 7' },
  { week: 3, runMinutes: 2, walkMinutes: 3, repetitions: 6, totalMinutes: 30, description: '2 min corriendo + 3 min caminando × 6' },
  { week: 4, runMinutes: 2, walkMinutes: 3, repetitions: 7, totalMinutes: 35, description: '2 min corriendo + 3 min caminando × 7' },
  { week: 5, runMinutes: 2, walkMinutes: 3, repetitions: 8, totalMinutes: 40, description: '2 min corriendo + 3 min caminando × 8' },
  { week: 6, runMinutes: 3, walkMinutes: 2, repetitions: 8, totalMinutes: 40, description: '3 min corriendo + 2 min caminando × 8' },
  { week: 7, runMinutes: 3, walkMinutes: 2, repetitions: 9, totalMinutes: 45, description: '3 min corriendo + 2 min caminando × 9' },
  { week: 8, runMinutes: 3.5, walkMinutes: 1.5, repetitions: 7, totalMinutes: 35, description: '3.5 min corriendo + 1.5 min caminando × 7' },
  { week: 9, runMinutes: 4, walkMinutes: 1, repetitions: 7, totalMinutes: 35, description: '4 min corriendo + 1 min caminando × 7' },
  { week: 10, runMinutes: 4.5, walkMinutes: 0.5, repetitions: 8, totalMinutes: 40, description: '4.5 min corriendo + 0.5 min caminando × 8' },
  { week: 11, runMinutes: 40, walkMinutes: 0, repetitions: 1, totalMinutes: 40, description: '¡40 minutos corriendo sin parar! 🏆' },
];

export const SESSIONS_PER_WEEK = 3;

export function getWeekProgress(week: number): number {
  return Math.round((week / CACO_PLAN.length) * 100);
}

export function getRunPercentage(week: CacoWeek): number {
  if (week.walkMinutes === 0) return 100;
  const interval = week.runMinutes + week.walkMinutes;
  return Math.round((week.runMinutes / interval) * 100);
}
