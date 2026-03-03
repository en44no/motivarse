export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood?: string; // emoji
  createdAt: number;
  updatedAt: number;
}
