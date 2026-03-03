import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { LoveNote, NoteColor } from '../types/notes';

const notesCol = collection(db, 'loveNotes');

const NOTE_COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple'];

function randomColor(): NoteColor {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
}

/**
 * Send a love note to partner.
 */
export async function sendNote(
  coupleId: string,
  fromUserId: string,
  toUserId: string,
  text: string,
  emoji?: string,
): Promise<void> {
  await addDoc(notesCol, {
    coupleId,
    fromUserId,
    toUserId,
    text,
    emoji: emoji || null,
    color: randomColor(),
    read: false,
    createdAt: Date.now(),
  });
}

/**
 * Subscribe to love notes for a couple (last 20, newest first).
 */
export function subscribeToNotes(
  coupleId: string,
  callback: (notes: LoveNote[]) => void,
): Unsubscribe {
  const q = query(
    notesCol,
    where('coupleId', '==', coupleId),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LoveNote)));
    },
    (error) => {
      console.error('Error subscribing to love notes:', error);
      callback([]);
    },
  );
}

/**
 * Mark a note as read.
 */
export async function markNoteRead(noteId: string): Promise<void> {
  await updateDoc(doc(db, 'loveNotes', noteId), { read: true });
}

/**
 * Delete a note.
 */
export async function deleteNote(noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'loveNotes', noteId));
}
