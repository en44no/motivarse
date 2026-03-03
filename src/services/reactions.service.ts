import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type ReactionType = '🔥' | '👏' | '❤️' | '💪';
export type ReactionTargetType = 'habit' | 'run' | 'streak';

export interface Reaction {
  id: string;
  coupleId: string;
  fromUserId: string;
  toUserId: string;
  type: ReactionType;
  targetType: ReactionTargetType;
  targetDate: string;
  createdAt: number;
}

const reactionsCol = collection(db, 'reactions');

/**
 * Send a reaction. Doc ID = `${fromUserId}_${type}_${targetDate}` to enforce max 1 per type per day.
 */
export async function sendReaction(
  coupleId: string,
  fromUserId: string,
  toUserId: string,
  type: ReactionType,
  targetType: ReactionTargetType,
  targetDate: string,
): Promise<void> {
  const docId = `${fromUserId}_${type}_${targetDate}`;
  await setDoc(doc(db, 'reactions', docId), {
    coupleId,
    fromUserId,
    toUserId,
    type,
    targetType,
    targetDate,
    createdAt: Date.now(),
  });
}

/**
 * Subscribe to recent reactions for a couple (last 50).
 */
export function subscribeToReactions(
  coupleId: string,
  callback: (reactions: Reaction[]) => void,
): Unsubscribe {
  const q = query(
    reactionsCol,
    where('coupleId', '==', coupleId),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reaction)));
    },
    (error) => {
      console.error('Error subscribing to reactions:', error);
      callback([]);
    },
  );
}

/**
 * Get reactions for a specific date.
 */
export async function getReactionsForDate(
  coupleId: string,
  date: string,
): Promise<Reaction[]> {
  const q = query(
    reactionsCol,
    where('coupleId', '==', coupleId),
    where('targetDate', '==', date),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reaction));
}
