import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();

export const dailyHabitReminder = onSchedule(
  { schedule: '0 1 * * *', timeZone: 'America/Montevideo' },
  async () => {
    const snap = await getFirestore()
      .collection('users')
      .where('notificationsEnabled', '==', true)
      .get();

    const messages = snap.docs
      .filter((d) => !!d.data().fcmToken)
      .map((d) => ({
        token: d.data().fcmToken as string,
        notification: {
          title: 'Motivarse 💪',
          body: '¡Recordá completar tus hábitos de hoy!',
        },
      }));

    if (messages.length > 0) {
      await getMessaging().sendEach(messages);
    }
  }
);
