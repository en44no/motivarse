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
import type { ExpenseCategory } from '../types/expense';

const expenseCategoriesCol = collection(db, 'expenseCategories');

export function subscribeToExpenseCategories(
  coupleId: string,
  callback: (categories: ExpenseCategory[]) => void,
): Unsubscribe {
  const q = query(expenseCategoriesCol, where('coupleId', '==', coupleId));
  return onSnapshot(
    q,
    (snap) => {
      const categories = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ExpenseCategory))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      callback(categories);
    },
    (error) => {
      callback([]);
    },
  );
}

export async function addExpenseCategory(category: Omit<ExpenseCategory, 'id'>): Promise<string> {
  const docRef = await addDoc(expenseCategoriesCol, category);
  return docRef.id;
}

export async function updateExpenseCategory(id: string, data: Partial<ExpenseCategory>): Promise<void> {
  await updateDoc(doc(db, 'expenseCategories', id), data);
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'expenseCategories', id));
}
