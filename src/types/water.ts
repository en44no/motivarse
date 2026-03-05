export interface WaterLog {
  id: string;
  userId: string;
  coupleId: string;
  date: string; // "YYYY-MM-DD"
  amount: number; // ml
  timestamp: number;
}

export const WATER_GOAL_ML = 2000;

export const WATER_QUICK_AMOUNTS = [
  { label: 'Vaso (250ml)', amount: 250 },
  { label: '500ml', amount: 500 },
  { label: '1L', amount: 1000 },
  { label: '1.2L', amount: 1200 },
] as const;
