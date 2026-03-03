import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { RunLog, RunProgress } from '../types/running';

const runLogsCol = collection(db, 'runLogs');

export function subscribeToRunLogs(coupleId: string, callback: (logs: RunLog[]) => void): Unsubscribe {
  const q = query(runLogsCol, where('coupleId', '==', coupleId));
  return onSnapshot(q, (snap) => {
    const logs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as RunLog))
      .sort((a, b) => (b.date > a.date ? 1 : -1));
    callback(logs);
  }, (error) => {
    console.error('Error subscribing to run logs:', error);
    callback([]);
  });
}

export async function addRunLog(log: Omit<RunLog, 'id'>): Promise<string> {
  const docRef = await addDoc(runLogsCol, log);
  return docRef.id;
}

export function subscribeToRunProgress(coupleId: string, callback: (progress: RunProgress | null) => void): Unsubscribe {
  const docRef = doc(db, 'runProgress', coupleId);
  return onSnapshot(docRef, (snap) => {
    callback(snap.exists() ? (snap.data() as RunProgress) : null);
  }, (error) => {
    console.error('Error subscribing to run progress:', error);
    callback(null);
  });
}

export async function updateRunProgress(coupleId: string, progress: Partial<RunProgress>): Promise<void> {
  await setDoc(doc(db, 'runProgress', coupleId), { coupleId, ...progress }, { merge: true });
}

export async function getRunProgress(coupleId: string): Promise<RunProgress | null> {
  const snap = await getDoc(doc(db, 'runProgress', coupleId));
  return snap.exists() ? (snap.data() as RunProgress) : null;
}

export async function deleteRunLog(id: string): Promise<void> {
  await deleteDoc(doc(db, 'runLogs', id));
}
