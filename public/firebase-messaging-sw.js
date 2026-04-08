// Service worker para notificaciones push en background
// No usa Firebase SDK — maneja el push nativo directamente

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {};
  }

  const title = payload.notification?.title || 'Gestionarse 💪';
  const body = payload.notification?.body || '¡Recordá completar tus hábitos de hoy!';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
    })
  );
});
