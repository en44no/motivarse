import { useRef, useCallback, useEffect } from 'react';

interface UseLongPressOptions {
  onActivate: (event: PointerEvent) => void;
  delay?: number;
  moveThreshold?: number;
}

export function useLongPress({ onActivate, delay = 400, moveThreshold = 10 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const activatedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPos.current = null;
    activatedRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => clear, [clear]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      activatedRef.current = false;
      startPos.current = { x: e.clientX, y: e.clientY };
      const nativeEvent = e.nativeEvent;
      timerRef.current = setTimeout(() => {
        activatedRef.current = true;
        navigator.vibrate?.(50);
        onActivate(nativeEvent);
      }, delay);
    },
    [onActivate, delay]
  );

  const onPointerUp = useCallback(() => {
    clear();
  }, [clear]);

  const onPointerCancel = useCallback(() => {
    clear();
  }, [clear]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPos.current) return;
      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);
      if (dx > moveThreshold || dy > moveThreshold) {
        clear();
      }
    },
    [moveThreshold, clear]
  );

  return { onPointerDown, onPointerUp, onPointerCancel, onPointerMove };
}
