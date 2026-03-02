import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CoupleCategory } from '../types/category';
import { DEFAULT_CATEGORIES } from '../config/constants';

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
      console.error('Error subscribing to categories:', error);
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

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'coupleCategories', id));
}

export async function seedDefaultCategories(
  coupleId: string,
  userId: string
): Promise<void> {
  const q = query(categoriesCol, where('coupleId', '==', coupleId));
  const snap = await getDocs(q);
  if (snap.size > 0) return;

  const now = Date.now();
  await Promise.all(
    DEFAULT_CATEGORIES.map((cat) =>
      addDoc(categoriesCol, {
        coupleId,
        label: cat.label,
        emoji: cat.emoji,
        createdAt: now,
        createdBy: userId,
      })
    )
  );
}
