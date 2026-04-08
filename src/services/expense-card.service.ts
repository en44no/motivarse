import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ExpenseCard } from '../types/expense';

const expenseCardsCol = collection(db, 'expenseCards');

export function subscribeToExpenseCards(
  coupleId: string,
  callback: (cards: ExpenseCard[]) => void,
): Unsubscribe {
  const q = query(expenseCardsCol, where('coupleId', '==', coupleId));
  return onSnapshot(
    q,
    (snap) => {
      const cards = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ExpenseCard))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      callback(cards);
    },
    (error) => {
      callback([]);
    },
  );
}

export async function addExpenseCard(card: Omit<ExpenseCard, 'id'>): Promise<string> {
  const docRef = await addDoc(expenseCardsCol, card);
  return docRef.id;
}

export async function deleteExpenseCard(id: string): Promise<void> {
  await deleteDoc(doc(db, 'expenseCards', id));
}
