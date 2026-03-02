export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoCategory = 'super' | 'farmacia' | 'casa' | 'comida' | 'finanzas' | 'auto' | 'otros';
export type TodoRecurring = 'none' | 'weekly' | 'monthly';

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
  category?: TodoCategory;
  recurring?: TodoRecurring;
  createdAt: number;
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

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  condition: string;
}
