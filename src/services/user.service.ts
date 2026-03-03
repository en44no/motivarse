import { doc, onSnapshot, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile, Couple } from '../types/user';

export function subscribeToUser(uid: string, callback: (user: UserProfile | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserProfile) : null);
  }, (error) => {
    callback(null);
  });
}

export function subscribeToCouple(coupleId: string, callback: (couple: Couple | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'couples', coupleId), (snap) => {
    callback(snap.exists() ? (snap.data() as Couple) : null);
  }, (error) => {
    callback(null);
  });
}

export async function updateUserSettings(uid: string, settings: Partial<UserProfile['settings']>): Promise<void> {
  // Use dot notation for partial merge — avoids overwriting the entire settings object
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    updates[`settings.${key}`] = value;
  }
  await updateDoc(doc(db, 'users', uid), updates);
}
