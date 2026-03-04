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

const col = collection(db, 'wishlistCategories');

export function subscribeToWishlistCategories(
  coupleId: string,
  callback: (categories: CoupleCategory[]) => void,
): Unsubscribe {
  const q = query(col, where('coupleId', '==', coupleId));
  return onSnapshot(
    q,
    (snap) => {
      const categories = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as CoupleCategory))
        .sort((a, b) => a.createdAt - b.createdAt);
      callback(categories);
    },
    () => {
      callback([]);
    },
  );
}

export async function addWishlistCategory(
  category: Omit<CoupleCategory, 'id'>,
): Promise<string> {
  const docRef = await addDoc(col, category);
  return docRef.id;
}

export async function updateWishlistCategory(
  id: string,
  label: string,
  emoji: string,
): Promise<void> {
  await updateDoc(doc(db, 'wishlistCategories', id), { label, emoji });
}

export async function deleteWishlistCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'wishlistCategories', id));
}
