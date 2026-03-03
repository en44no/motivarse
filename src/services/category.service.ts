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
import type { CoupleCategory } from '../types/category';

const categoriesCol = collection(db, 'coupleCategories');

export function subscribeToCategories(
  coupleId: string,
  callback: (categories: CoupleCategory[]) => void
): Unsubscribe {
  const q = query(categoriesCol, where('coupleId', '==', coupleId));
  return onSnapshot(
    q,
    (snap) => {
      const categories = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as CoupleCategory))
        .sort((a, b) => a.createdAt - b.createdAt);
      callback(categories);
    },
    (error) => {
      callback([]);
    }
  );
}

export async function addCategory(
  category: Omit<CoupleCategory, 'id'>
): Promise<string> {
  const docRef = await addDoc(categoriesCol, category);
  return docRef.id;
}

export async function updateCategory(id: string, label: string, emoji: string): Promise<void> {
  await updateDoc(doc(db, 'coupleCategories', id), { label, emoji });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'coupleCategories', id));
}

