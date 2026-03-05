import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { WaterLog } from '../types/water';

const waterLogsCol = collection(db, 'waterLogs');

export function subscribeToWaterLogs(
  coupleId: string,
  date: string,
  callback: (logs: WaterLog[]) => void
): Unsubscribe {
  const q = query(
    waterLogsCol,
    where('coupleId', '==', coupleId),
    where('date', '==', date)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WaterLog)));
  });
}

export async function addWaterLog(log: Omit<WaterLog, 'id'>): Promise<string> {
  const docRef = await addDoc(waterLogsCol, log);
  return docRef.id;
}

export async function resetWaterLogs(
  userId: string,
  coupleId: string,
  date: string
): Promise<void> {
  const q = query(
    waterLogsCol,
    where('coupleId', '==', coupleId),
    where('date', '==', date),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
