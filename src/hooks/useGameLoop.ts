'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';

const FLUSH_INTERVAL_MS = 10_000;

export function useGameLoop() {
  const { phase, tick, clearPendingAttempts, sessionId } = useGameStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => tick(), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, tick]);

  const flush = async (attempts: ReturnType<typeof useGameStore.getState>['pendingAttempts']) => {
    if (attempts.length === 0) return;
    try {
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempts, sessionId }),
      });
      clearPendingAttempts();
    } catch {
      // Silently fail — game loop is never affected
    }
  };

  useEffect(() => {
    if (phase === 'playing') {
      flushRef.current = setInterval(() => {
        const attempts = useGameStore.getState().pendingAttempts;
        if (attempts.length > 0) flush([...attempts]);
      }, FLUSH_INTERVAL_MS);
    } else if (phase === 'finished') {
      const attempts = useGameStore.getState().pendingAttempts;
      flush([...attempts]);
      if (flushRef.current) clearInterval(flushRef.current);
    }
    return () => { if (flushRef.current) clearInterval(flushRef.current); };
  }, [phase]);
}
