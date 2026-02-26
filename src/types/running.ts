export interface CacoWeek {
  week: number;
  runMinutes: number;
  walkMinutes: number;
  repetitions: number;
  totalMinutes: number;
  description: string;
}

export interface RunLog {
  id: string;
  userId: string;
  coupleId: string;
  date: string;
  cacoPlanWeek?: number;
  cacoPlanSession?: number;
  durationMinutes: number;
  distanceKm?: number;
  paceMinKm?: string;
  isFreeRun?: boolean;
  isSharedRun?: boolean;
  mood: 1 | 2 | 3 | 4 | 5;
  note?: string;
  intervals?: {
    runMinutes: number;
    walkMinutes: number;
    repetitions: number;
  };
  createdAt: number;
}

export interface RunProgress {
  userId: string;
  currentWeek: number;
  currentSession: number;
  totalRuns: number;
  totalDistanceKm: number;
  runStreak: number;
  longestRunStreak: number;
  lastRunDate: string;
}
