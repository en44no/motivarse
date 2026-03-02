importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA2AM6f9dHOSUoco1CV3a6OQiiXh7fkfx0',
  authDomain: 'motivarse-b5cf8.firebaseapp.com',
  projectId: 'motivarse-b5cf8',
  storageBucket: 'motivarse-b5cf8.firebasestorage.app',
  messagingSenderId: '324978092208',
  appId: '1:324978092208:web:69b2f975495f758cee7375',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Motivarse';
  const body = payload.notification?.body || '¡Recordá completar tus hábitos de hoy!';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
  });
});
