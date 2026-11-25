import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

const winBridge =
  typeof window !== 'undefined'
    ? (window as unknown as { Android?: { isNativeAndroid?: () => boolean } }).Android
    : undefined;
const isNativeAndroidApk = Boolean(
  typeof winBridge?.isNativeAndroid === 'function' && winBridge.isNativeAndroid()
);

// Register VitePWA Service Worker ONLY on Web/PWA; in Native APK or dev preview clean up any stale SW so OTA updates load fresh immediately
if (import.meta.env.PROD && !isNativeAndroidApk) {
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
  if (isNativeAndroidApk && typeof window !== 'undefined' && 'caches' in window) {
    window.caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => window.caches.delete(k))))
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(<App />);
