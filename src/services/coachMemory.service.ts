import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CoachMessage } from './ai.service';

const MAX_HISTORY = 40;

export async function loadCoachHistory(userId: string): Promise<CoachMessage[]> {
  try {
    const snap = await getDoc(doc(db, 'coachHistory', userId));
    if (!snap.exists()) return [];
    return (snap.data().messages as CoachMessage[]) ?? [];
  } catch {
    return [];
  }
}

export async function saveCoachHistory(userId: string, messages: CoachMessage[]): Promise<void> {
  try {
    const trimmed = messages.slice(-MAX_HISTORY);
    await setDoc(doc(db, 'coachHistory', userId), { messages: trimmed, updatedAt: Date.now() });
  } catch {
    // silently fail — historial es best-effort
  }
}

export async function loadCoachMemory(userId: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'coachMemory', userId));
    if (!snap.exists()) return '';
    return (snap.data().notes as string) ?? '';
  } catch {
    return '';
  }
}

export async function saveCoachMemory(userId: string, notes: string): Promise<void> {
  try {
    await setDoc(doc(db, 'coachMemory', userId), { notes, updatedAt: Date.now() });
  } catch {
    // silently fail
  }
}
