export interface WishlistItem {
  id: string;
  coupleId: string;
  title: string;
  description?: string;
  category?: string;
  completed: boolean;
  completedAt?: number;
  completedBy?: string;
  createdBy: string;
  createdAt: number;
}
