import { useCallback, useEffect, useRef, useState } from 'react';
import { IDLE_HIDE_DELAY_MS } from '@/constants/player';

export function useIdleChrome(paused: boolean) {
  const [isUserActive, setIsUserActive] = useState(true);
  const hideTimer = useRef<number | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setIsUserActive(false), IDLE_HIDE_DELAY_MS);
  }, []);

  const handleActivity = useCallback(() => {
    setIsUserActive(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    scheduleHide();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [scheduleHide]);

  useEffect(() => {
    if (paused) handleActivity();
  }, [paused, handleActivity]);

  return { isUserActive, handleActivity };
}
