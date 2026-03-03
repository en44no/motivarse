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
import type { WishlistItem } from '../types/wishlist';

const wishlistCol = collection(db, 'wishlistItems');

export function subscribeToWishlist(
  coupleId: string,
  callback: (items: WishlistItem[]) => void,
): Unsubscribe {
  const q = query(wishlistCol, where('coupleId', '==', coupleId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as WishlistItem))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      callback(items);
    },
    (error) => {
      callback([]);
    },
  );
}

export async function addWishlistItem(item: Omit<WishlistItem, 'id'>): Promise<string> {
  const docRef = await addDoc(wishlistCol, item);
  return docRef.id;
}

export async function updateWishlistItem(id: string, data: Partial<WishlistItem>): Promise<void> {
  await updateDoc(doc(db, 'wishlistItems', id), data);
}

export async function deleteWishlistItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'wishlistItems', id));
}
