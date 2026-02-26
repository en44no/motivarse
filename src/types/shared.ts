export type TodoPriority = 'low' | 'medium' | 'high';

export interface SharedTodo {
  id: string;
  coupleId: string;
  title: string;
  completed: boolean;
  completedBy?: string;
  createdBy: string;
  priority: TodoPriority;
  dueDate?: string;
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
