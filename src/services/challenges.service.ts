import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type ChallengeType = 'habits' | 'runs' | 'journal';
export type ChallengeStatus = 'active' | 'completed';

export interface Challenge {
  id: string;
  coupleId: string;
  weekStart: string;
  type: ChallengeType;
  target: number;
  progress: Record<string, number>;
  status: ChallengeStatus;
  createdAt: number;
}

const challengesCol = collection(db, 'challenges');

/**
 * Subscribe to the active challenge for a couple.
 */
export function subscribeToActiveChallenge(
  coupleId: string,
  callback: (challenge: Challenge | null) => void,
): Unsubscribe {
  const q = query(
    challengesCol,
    where('coupleId', '==', coupleId),
    where('status', '==', 'active'),
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      // Take the most recent active challenge
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Challenge));
      docs.sort((a, b) => b.createdAt - a.createdAt);
      callback(docs[0]);
    },
    (error) => {
      console.error('Error subscribing to challenges:', error);
      callback(null);
    },
  );
}

/**
 * Create a new weekly challenge.
 */
export async function createWeeklyChallenge(
  coupleId: string,
  type: ChallengeType,
  target: number,
  weekStart: string,
): Promise<string> {
  const docRef = await addDoc(challengesCol, {
    coupleId,
    weekStart,
    type,
    target,
    progress: {},
    status: 'active',
    createdAt: Date.now(),
  });
  return docRef.id;
}

/**
 * Update a user's progress in a challenge.
 */
export async function updateChallengeProgress(
  challengeId: string,
  userId: string,
  progress: number,
): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), {
    [`progress.${userId}`]: progress,
  });
}

/**
 * Mark a challenge as completed.
 */
export async function completeChallenge(challengeId: string): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), {
    status: 'completed',
  });
}
