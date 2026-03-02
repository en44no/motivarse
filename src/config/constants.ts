import type { AchievementDef } from '../types/shared';
import type { CoupleCategory } from '../types/category';

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  { id: 'first_habit', name: 'Primer paso', description: 'Completaste tu primer hábito', icon: '🌱', type: 'individual', condition: 'complete_1_habit' },
  { id: 'streak_3', name: 'En racha', description: '3 días seguidos con un hábito', icon: '⚡', type: 'individual', condition: 'streak_3' },
  { id: 'streak_7', name: 'Semana perfecta', description: '7 días seguidos con un hábito', icon: '🔥', type: 'individual', condition: 'streak_7' },
  { id: 'streak_14', name: 'Imparable', description: '14 días seguidos', icon: '💪', type: 'individual', condition: 'streak_14' },
  { id: 'streak_30', name: 'Leyenda', description: '30 días seguidos', icon: '👑', type: 'individual', condition: 'streak_30' },
  { id: 'first_run', name: 'Primer trote', description: 'Completaste tu primera sesión CaCo', icon: '🏃', type: 'individual', condition: 'first_run' },
  { id: 'caco_week_1', name: 'Semana 1 CaCo', description: 'Completaste la primera semana del plan', icon: '🎯', type: 'individual', condition: 'caco_week_1' },
  { id: 'caco_complete', name: 'Runner certificado', description: 'Completaste las 11 semanas del Método CaCo', icon: '🏆', type: 'individual', condition: 'caco_complete' },
  { id: 'couple_sync', name: 'Sincronizados', description: 'Ambos completaron todos los hábitos del día', icon: '💕', type: 'couple', condition: 'both_complete_day' },
  { id: 'couple_streak_7', name: 'Pareja en fuego', description: '7 días seguidos ambos completando hábitos', icon: '🔥💕', type: 'couple', condition: 'couple_streak_7' },
  { id: 'couple_run', name: 'Corren juntos', description: 'Ambos corrieron en el mismo día', icon: '👫🏃', type: 'couple', condition: 'couple_same_day_run' },
  { id: 'early_birds', name: 'Madrugadores', description: 'Ambos se despertaron temprano por una semana', icon: '🌅', type: 'couple', condition: 'couple_early_week' },
];

export const DEFAULT_CATEGORIES: Omit<CoupleCategory, 'id' | 'coupleId' | 'createdAt' | 'createdBy'>[] = [
  { label: 'Super', emoji: '🛒' },
  { label: 'Farmacia', emoji: '💊' },
  { label: 'Casa', emoji: '🏠' },
  { label: 'Comida', emoji: '🍽️' },
  { label: 'Finanzas', emoji: '💰' },
  { label: 'Auto', emoji: '🚗' },
  { label: 'Otros', emoji: '📦' },
];

export const MOOD_OPTIONS = [
  { value: 1, emoji: '😫', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Difícil' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '🤩', label: 'Increíble' },
] as const;
