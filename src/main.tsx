import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register VitePWA Service Worker in production; in dev preview clean up any stale SW so module loading stays fresh
if (import.meta.env.PROD) {
  try {
    registerSW({
      immediate: true,
      onRegisterError() {
        // Ignore SW registration restrictions in sandboxed preview environments
      },
    });
  } catch {
    // Ignore synchronous SW registration errors
  }
} else if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((r) => {
        r.unregister().catch(() => {});
      });
    })
    .catch(() => {});
}

createRoot(document.getElementById('root')!).render(<App />);
