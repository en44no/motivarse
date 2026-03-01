/**
 * Celebration utilities: confetti triggers, haptic feedback, milestone detection
 */

// Haptic feedback patterns
export function vibrateSuccess() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
}

export function vibrateMilestone() {
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100, 50, 200]);
  }
}

// Streak milestone detection
const STREAK_MILESTONES = [7, 30, 100];

export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

export function getMilestoneMessage(streak: number): string | null {
  switch (streak) {
    case 7: return '1 semana de racha!';
    case 30: return '1 mes de racha!';
    case 100: return '100 dias de racha!';
    default: return null;
  }
}
