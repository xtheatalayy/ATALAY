'use client';

import { useEffect } from 'react';

/** Registers the service worker with a per-build version so caches roll over on every deploy. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let cancelled = false;

    const register = async () => {
      try {
        let version = 'dev';
        try {
          const res = await fetch('/api/sw-version', { cache: 'no-store' });
          if (res.ok) {
            const payload = (await res.json()) as { version?: string };
            if (payload?.version) version = payload.version;
          }
        } catch {
          // offline or blocked: fall back to the default version
        }
        if (cancelled) return;
        await navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(version)}`, { scope: '/' });
      } catch (error) {
        console.warn('[sw] kayıt başarısız', error);
      }
    };

    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', register, { once: true });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
