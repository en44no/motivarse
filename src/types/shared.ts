export type TodoPriority = 'low' | 'medium' | 'high';

export interface SharedTodo {
  id: string;
  coupleId: string;
  title: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: number;
  createdBy: string;
  priority: TodoPriority;
  dueDate?: string;
  category?: string;
  createdAt: number;
}

export interface PurchaseRecord {
  id: string;
  coupleId: string;
  title: string;
  originalTitle: string;
  category?: string;
  completedBy: string;
  completedAt: number;
}

export type AchievementType = 'individual' | 'couple';

export interface Achievement {
  id: string;
  coupleId: string;
  userId?: string;
  type: AchievementType;
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
}

export type AchievementCategory = 'habits' | 'running' | 'journal' | 'couple' | 'general';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  category: AchievementCategory;
  condition: string;
}
