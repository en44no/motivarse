export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple';

export interface LoveNote {
  id: string;
  coupleId: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  emoji?: string;
  color: NoteColor;
  read: boolean;
  createdAt: number;
}
