import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { UserProfile, Couple } from '../types/user';

export async function registerUser(email: string, password: string, displayName: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  const profile: Omit<UserProfile, 'uid'> & { uid: string } = {
    uid: cred.user.uid,
    email,
    displayName,
    partnerId: null,
    coupleId: null,
    createdAt: Date.now(),
    settings: { notifications: true },
  };

  await setDoc(doc(db, 'users', cred.user.uid), profile);
  return cred.user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function linkPartner(currentUid: string, partnerEmail: string): Promise<void> {
  // Find partner by email - in a real app you'd use a query
  // For simplicity, we'll use a known partner approach
  const { getDocs, query, collection, where } = await import('firebase/firestore');
  const q = query(collection(db, 'users'), where('email', '==', partnerEmail));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error('No se encontró usuario con ese email');

  const partnerDoc = snap.docs[0];
  const partnerId = partnerDoc.id;

  if (partnerId === currentUid) throw new Error('No podés vincularte contigo mismo');

  const coupleId = [currentUid, partnerId].sort().join('_');

  const couple: Couple = {
    coupleId,
    members: [currentUid, partnerId] as [string, string],
    memberNames: {
      [currentUid]: (await getDoc(doc(db, 'users', currentUid))).data()?.displayName || 'Usuario',
      [partnerId]: partnerDoc.data()?.displayName || 'Pareja',
    },
    createdAt: Date.now(),
  };

  await setDoc(doc(db, 'couples', coupleId), couple);
  await updateDoc(doc(db, 'users', currentUid), { partnerId, coupleId });
  await updateDoc(doc(db, 'users', partnerId), { partnerId: currentUid, coupleId });
}
