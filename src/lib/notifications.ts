import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { db } from '../config/firebase';

function getMessagingInstance() {
  return getMessaging(getApp());
}

export async function requestPushPermission(userId: string): Promise<boolean> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging is not supported in this browser');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const messaging = getMessagingInstance();
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });

    if (token) {
      await saveFcmToken(userId, token);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function saveFcmToken(userId: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    fcmToken: token,
    notificationsEnabled: true,
  });
}

export async function disablePushNotifications(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    notificationsEnabled: false,
  });
}
