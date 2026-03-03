import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { JournalEntry } from '../types/journal';

const journalCol = collection(db, 'journalEntries');

export function subscribeToJournalEntries(
  userId: string,
  callback: (entries: JournalEntry[]) => void,
): Unsubscribe {
  const q = query(
    journalCol,
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(30),
  );
  return onSnapshot(
    q,
    (snap) => {
      const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntry));
      callback(entries);
    },
    (error) => {
      console.error('Error subscribing to journal entries:', error);
      callback([]);
    },
  );
}

export async function saveJournalEntry(
  userId: string,
  date: string,
  content: string,
  mood?: string,
): Promise<void> {
  const docId = `${userId}_${date}`;
  const docRef = doc(db, 'journalEntries', docId);

  // Check if entry already exists to preserve createdAt
  const existingSnap = await getDocs(
    query(journalCol, where('userId', '==', userId), where('date', '==', date), limit(1)),
  );
  const existing = existingSnap.docs[0]?.data();

  await setDoc(docRef, {
    userId,
    date,
    content,
    ...(mood ? { mood } : {}),
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  });
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'journalEntries', entryId));
}
