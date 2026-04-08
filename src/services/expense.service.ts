import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Expense } from '../types/expense';

const expensesCol = collection(db, 'expenses');

export function subscribeToExpenses(
  coupleId: string,
  callback: (expenses: Expense[]) => void,
): Unsubscribe {
  const q = query(expensesCol, where('coupleId', '==', coupleId));
  return onSnapshot(
    q,
    (snap) => {
      const expenses = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Expense))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      callback(expenses);
    },
    (error) => {
      callback([]);
    },
  );
}

export async function addExpense(data: Omit<Expense, 'id'>): Promise<string> {
  const docRef = await addDoc(expensesCol, data);
  return docRef.id;
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<void> {
  await updateDoc(doc(db, 'expenses', id), data);
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', id));
}
