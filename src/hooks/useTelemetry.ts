import { useEffect, useState } from 'react';
import type { BrowserTelemetry } from '../types';

function detectWebGL(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (gl2) return 'WebGL2';
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl ? 'WebGL' : 'None';
  } catch {
    return 'Unknown';
  }
}

function connectionLabel(): string {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number };
  };
  const c = nav.connection;
  if (!c) return 'Unknown';
  const type = c.effectiveType?.toUpperCase() ?? '—';
  const down = c.downlink != null ? `${c.downlink}Mbps` : '';
  return down ? `${type} · ${down}` : type;
}

export function useTelemetry(enabled = true): BrowserTelemetry {
  const [telemetry, setTelemetry] = useState<BrowserTelemetry>({
    fps: null,
    viewport: '—',
    deviceMemory: '—',
    connection: '—',
    online: true,
    reducedMotion: false,
    webgl: '—',
    language: 'en',
  });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const nav = navigator as Navigator & { deviceMemory?: number };
    const memory = typeof nav.deviceMemory === 'number' ? `${nav.deviceMemory} GB` : 'n/a';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setTelemetry((t) => ({
      ...t,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      deviceMemory: memory,
      connection: connectionLabel(),
      online: navigator.onLine,
      reducedMotion,
      webgl: detectWebGL(),
      language: navigator.language || 'en',
    }));

    const onResize = () => {
      setTelemetry((t) => ({
        ...t,
        viewport: `${window.innerWidth}×${window.innerHeight}`,
      }));
    };
    const onOnline = () => setTelemetry((t) => ({ ...t, online: true }));
    const onOffline = () => setTelemetry((t) => ({ ...t, online: false }));

    window.addEventListener('resize', onResize);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Real FPS sample (not fake server metrics)
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setTelemetry((t) => ({ ...t, fps: frames }));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return telemetry;
}
