import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  setDoc,
  getDocs,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Habit, HabitLog, HabitStreak } from '../types/habit';

const habitsCol = collection(db, 'habits');
const logsCol = collection(db, 'habitLogs');
const streaksCol = collection(db, 'streaks');

export function subscribeToHabits(coupleId: string, callback: (habits: Habit[]) => void): Unsubscribe {
  const q = query(habitsCol, where('coupleId', '==', coupleId));
  return onSnapshot(q, (snap) => {
    const habits = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Habit))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    callback(habits);
  }, (error) => {
    console.error('Error subscribing to habits:', error);
    callback([]);
  });
}

export async function restoreHabit(id: string): Promise<void> {
  await updateDoc(doc(db, 'habits', id), { isActive: true });
}

export function subscribeToHabitLogs(
  coupleId: string,
  startDate: string,
  endDate: string,
  callback: (logs: HabitLog[]) => void
): Unsubscribe {
  const q = query(
    logsCol,
    where('coupleId', '==', coupleId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HabitLog)));
  }, (error) => {
    console.error('Error subscribing to habit logs:', error);
    callback([]);
  });
}

export async function createHabit(habit: Omit<Habit, 'id'>): Promise<string> {
  // Remove undefined fields - Firestore doesn't accept them
  const clean = Object.fromEntries(
    Object.entries(habit).filter(([_, v]) => v !== undefined)
  );
  const docRef = await addDoc(habitsCol, clean);
  return docRef.id;
}

export async function updateHabit(id: string, data: Partial<Habit>): Promise<void> {
  await updateDoc(doc(db, 'habits', id), data);
}

export async function deleteHabit(id: string, userId: string): Promise<void> {
  // Query logs by habitId (logs use coupleId+date index, no rules issue)
  const logsSnap = await getDocs(query(logsCol, where('habitId', '==', id)));

  await Promise.all([
    deleteDoc(doc(db, 'habits', id)),
    // Delete streak by direct ref (avoids Firestore rules issues with queries)
    deleteDoc(doc(db, 'streaks', `${id}_${userId}`)),
    ...logsSnap.docs.map((d) => deleteDoc(d.ref)),
  ]);
}

export async function toggleHabitLog(
  habitId: string,
  userId: string,
  coupleId: string,
  date: string,
  completed: boolean,
  value?: string,
  metGoal?: boolean
): Promise<void> {
  const logId = `${habitId}_${userId}_${date}`;
  const logRef = doc(db, 'habitLogs', logId);

  if (completed) {
    const log: Record<string, unknown> = {
      habitId,
      userId,
      coupleId,
      date,
      completed: true,
      completedAt: Date.now(),
    };
    // Only include optional fields if defined — Firestore rejects undefined values
    if (value !== undefined) log.value = value;
    if (metGoal !== undefined) log.metGoal = metGoal;
    await setDoc(logRef, log);
  } else {
    await deleteDoc(logRef);
  }
}

export async function updateStreak(habitId: string, userId: string, streak: Partial<HabitStreak>): Promise<void> {
  const streakId = `${habitId}_${userId}`;
  await setDoc(doc(db, 'streaks', streakId), { habitId, userId, ...streak }, { merge: true });
}

export function subscribeToStreaks(userId: string, callback: (streaks: HabitStreak[]) => void): Unsubscribe {
  const q = query(streaksCol, where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as HabitStreak));
  }, (error) => {
    console.error('Error subscribing to streaks:', error);
    callback([]);
  });
}

export async function deleteOrphanedStreaks(userId: string, activeHabitIds: string[]): Promise<void> {
  const snap = await getDocs(query(streaksCol, where('userId', '==', userId)));
  const orphaned = snap.docs.filter((d) => !activeHabitIds.includes((d.data() as HabitStreak).habitId));
  await Promise.all(orphaned.map((d) => deleteDoc(d.ref)));
}

export async function batchUpdateHabitOrder(orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'habits', id), { order: index });
  });
  await batch.commit();
}

export async function getHabitLogsForDates(
  habitId: string,
  userId: string,
  dates: string[]
): Promise<HabitLog[]> {
  if (dates.length === 0) return [];
  const q = query(
    logsCol,
    where('habitId', '==', habitId),
    where('userId', '==', userId),
    where('date', 'in', dates.slice(0, 30))
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HabitLog));
}
