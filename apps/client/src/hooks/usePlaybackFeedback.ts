import { useCallback, useEffect, useRef, useState } from 'react';

export type FeedbackKind = 'play' | 'pause' | 'forward' | 'backward' | 'mute' | 'unmute';

interface Feedback {
  id: number;
  kind: FeedbackKind;
}

export function usePlaybackFeedback(isReady: boolean, isPlaying: boolean, isMuted: boolean) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackId = useRef(0);
  const feedbackTimer = useRef<number | null>(null);
  const prevState = useRef({ isPlaying, isMuted });

  const showFeedback = useCallback((kind: FeedbackKind) => {
    feedbackId.current += 1;
    setFeedback({ id: feedbackId.current, kind });
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 550);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  useEffect(() => {
    const prev = prevState.current;
    if (isReady) {
      if (isPlaying !== prev.isPlaying) showFeedback(isPlaying ? 'play' : 'pause');
      if (isMuted !== prev.isMuted) showFeedback(isMuted ? 'mute' : 'unmute');
    }
    prevState.current = { isPlaying, isMuted };
  }, [isPlaying, isMuted, isReady, showFeedback]);

  return { feedback, showFeedback };
}
