import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Auto-reload when returning to the app if a new SW is waiting
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  navigator.serviceWorker?.getRegistration().then((reg) => {
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
