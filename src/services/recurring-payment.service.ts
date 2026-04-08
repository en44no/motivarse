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
import type { RecurringPayment } from '../types/expense';

const recurringCol = collection(db, 'recurringPayments');

export function subscribeToRecurringPayments(
  coupleId: string,
  callback: (items: RecurringPayment[]) => void,
): Unsubscribe {
  const q = query(recurringCol, where('coupleId', '==', coupleId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as RecurringPayment))
        .sort((a, b) => (a.dayOfMonth ?? 0) - (b.dayOfMonth ?? 0));
      callback(items);
    },
    () => {
      callback([]);
    },
  );
}

export async function addRecurringPayment(
  data: Omit<RecurringPayment, 'id'>,
): Promise<string> {
  const docRef = await addDoc(recurringCol, data);
  return docRef.id;
}

export async function updateRecurringPayment(
  id: string,
  data: Partial<RecurringPayment>,
): Promise<void> {
  await updateDoc(doc(db, 'recurringPayments', id), data);
}

export async function deleteRecurringPayment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'recurringPayments', id));
}
