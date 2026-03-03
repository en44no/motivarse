import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Achievement } from '../types/shared';

const achievementsCol = collection(db, 'achievements');

export function subscribeToAchievements(
  coupleId: string,
  callback: (achievements: Achievement[]) => void
): Unsubscribe {
  const q = query(achievementsCol, where('coupleId', '==', coupleId));
  return onSnapshot(
    q,
    (snap) => {
      const achievements = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Achievement)
      );
      callback(achievements);
    },
    (error) => {
      callback([]);
    }
  );
}

export async function unlockAchievement(
  coupleId: string,
  achievementId: string,
  userId: string,
  name: string,
  description: string,
  icon: string,
  type: 'individual' | 'couple'
): Promise<void> {
  const docId = `${coupleId}_${achievementId}`;
  await setDoc(doc(db, 'achievements', docId), {
    coupleId,
    achievementId,
    ...(type === 'individual' ? { userId } : {}),
    type,
    name,
    description,
    icon,
    unlockedAt: Date.now(),
  });
}
