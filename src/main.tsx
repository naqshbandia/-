import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register VitePWA Service Worker for offline caching and installability
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

createRoot(document.getElementById('root')!).render(<App />);
