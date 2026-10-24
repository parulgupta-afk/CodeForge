import { useEffect, useState } from 'react';

const KEY = 'parul_engine_perf_mode';

export function usePerformanceMode() {
  const [performanceMode, setPerformanceMode] = useState(false);

  useEffect(() => {
    try {
      setPerformanceMode(localStorage.getItem(KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.perfMode = performanceMode ? '1' : '0';
    try {
      localStorage.setItem(KEY, performanceMode ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [performanceMode]);

  return {
    performanceMode,
    setPerformanceMode,
    toggle: () => setPerformanceMode((v) => !v),
  };
}
