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
import type { SharedTodo, PurchaseRecord } from '../types/shared';

const todosCol = collection(db, 'sharedTodos');
const purchaseHistoryCol = collection(db, 'purchaseHistory');

export function subscribeToTodos(coupleId: string, callback: (todos: SharedTodo[]) => void): Unsubscribe {
  const q = query(todosCol, where('coupleId', '==', coupleId));
  return onSnapshot(q, (snap) => {
    const todos = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as SharedTodo))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    callback(todos);
  }, (error) => {
    callback([]);
  });
}

export async function addTodo(todo: Omit<SharedTodo, 'id'>): Promise<string> {
  const docRef = await addDoc(todosCol, todo);
  return docRef.id;
}

export async function updateTodo(id: string, data: Partial<SharedTodo>): Promise<void> {
  await updateDoc(doc(db, 'sharedTodos', id), data);
}

export async function deleteTodo(id: string): Promise<void> {
  await deleteDoc(doc(db, 'sharedTodos', id));
}

export function subscribeToPurchaseHistory(
  coupleId: string,
  callback: (records: PurchaseRecord[]) => void
): Unsubscribe {
  const q = query(purchaseHistoryCol, where('coupleId', '==', coupleId));
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as PurchaseRecord))
        .sort((a, b) => b.completedAt - a.completedAt);
      callback(records);
    },
    (error) => {
      callback([]);
    }
  );
}

export async function addPurchaseRecord(
  record: Omit<PurchaseRecord, 'id'>
): Promise<void> {
  await addDoc(purchaseHistoryCol, record);
}
