import { getFunctions, httpsCallable } from 'firebase/functions';
import type { CoupleCategory } from '../types/category';
import type { HabitCategory, HabitFrequency, HabitScope } from '../types/habit';

const functions = getFunctions();
const aiProxy = httpsCallable(functions, 'aiProxy');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratedHabit {
  name: string;
  category: HabitCategory;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  description: string;
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CoachContext {
  userName: string;
  partnerName?: string;
  habitsCount: number;
  completedToday: number;
  totalToday: number;
  bestStreak: number;
  memory?: string;
}

// ── Functions ─────────────────────────────────────────────────────────────────

export async function autocategorize(
  title: string,
  categories: CoupleCategory[]
): Promise<string | null> {
  try {
    const result = await aiProxy({
      type: 'autocategorize',
      data: {
        title,
        categories: categories.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
      },
    });
    const { categoryId } = result.data as { categoryId: string | null };
    return categoryId;
  } catch {
    return null;
  }
}

export async function generateHabits(
  goal: string,
  scope: HabitScope,
  existingNames: string[]
): Promise<GeneratedHabit[]> {
  try {
    const result = await aiProxy({
      type: 'generateHabits',
      data: { goal, scope, existingNames },
    });
    const { habits } = result.data as { habits: GeneratedHabit[] };
    return habits ?? [];
  } catch {
    return [];
  }
}

export async function coachMessage(
  messages: CoachMessage[],
  context: CoachContext
): Promise<string> {
  try {
    const result = await aiProxy({
      type: 'coach',
      data: { messages, context },
    });
    const { content } = result.data as { content: string };
    return content ?? '';
  } catch (err) {
    return '';
  }
}

export async function updateCoachMemory(
  messages: CoachMessage[],
  existingMemory: string,
  userName: string
): Promise<string> {
  try {
    const result = await aiProxy({
      type: 'updateMemory',
      data: { messages, existingMemory, userName },
    });
    const { memory } = result.data as { memory: string };
    return memory ?? '';
  } catch (err) {
    return '';
  }
}
