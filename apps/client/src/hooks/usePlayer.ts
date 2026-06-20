import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaybackRate, PlayerActions, PlayerState } from '@/types';

const DEFAULT_STATE: PlayerState = {
  isPlaying: false,
  isMuted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  playbackRate: 1,
  isFullscreen: false,
  isReady: false,
};

/**
 * Owns a single <video> element and exposes a declarative state snapshot plus
 * an imperative action set. Also wires global keyboard shortcuts
 * (Space, ←/→, F, M, ↑/↓) and tracks fullscreen + buffering.
 */
export function usePlayer(options: { onSeek?: (deltaSeconds: number) => void } = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<PlayerState>(DEFAULT_STATE);

  // Keep the latest seek callback without re-creating memoized actions.
  const onSeekRef = useRef(options.onSeek);
  onSeekRef.current = options.onSeek;
  const lastTimeSync = useRef(0);

  const updatePlayerState = useCallback(
    (partial: Partial<PlayerState>) => setState((prev) => ({ ...prev, ...partial })),
    [],
  );

  // --- Sync React state from the media element's events ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncMeta = () =>
      updatePlayerState({
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        volume: video.volume,
        isMuted: video.muted,
        isReady: true,
      });
    const syncTime = () => {
      const now = performance.now();
      if (now - lastTimeSync.current < 250) return;
      lastTimeSync.current = now;
      updatePlayerState({ currentTime: video.currentTime });
    };
    const syncTimeImmediate = () => {
      lastTimeSync.current = performance.now();
      updatePlayerState({ currentTime: video.currentTime });
    };
    const syncPlay = () => updatePlayerState({ isPlaying: true });
    const syncPause = () => updatePlayerState({ isPlaying: false });
    const syncVolume = () => updatePlayerState({ volume: video.volume, isMuted: video.muted });
    const syncRate = () => updatePlayerState({ playbackRate: video.playbackRate as PlaybackRate });
    const syncProgress = () => {
      try {
        const { buffered } = video;
        if (buffered.length) updatePlayerState({ buffered: buffered.end(buffered.length - 1) });
      } catch {
        /* buffered ranges can throw before metadata loads */
      }
    };

    video.addEventListener('loadedmetadata', syncMeta);
    video.addEventListener('durationchange', syncMeta);
    video.addEventListener('timeupdate', syncTime);
    video.addEventListener('play', syncPlay);
    video.addEventListener('playing', syncPlay);
    video.addEventListener('pause', syncPause);
    video.addEventListener('ended', syncPause);
    video.addEventListener('seeked', syncTimeImmediate);
    video.addEventListener('volumechange', syncVolume);
    video.addEventListener('ratechange', syncRate);
    video.addEventListener('progress', syncProgress);

    return () => {
      video.removeEventListener('loadedmetadata', syncMeta);
      video.removeEventListener('durationchange', syncMeta);
      video.removeEventListener('timeupdate', syncTime);
      video.removeEventListener('play', syncPlay);
      video.removeEventListener('playing', syncPlay);
      video.removeEventListener('pause', syncPause);
      video.removeEventListener('ended', syncPause);
      video.removeEventListener('seeked', syncTimeImmediate);
      video.removeEventListener('volumechange', syncVolume);
      video.removeEventListener('ratechange', syncRate);
      video.removeEventListener('progress', syncProgress);
    };
  }, [updatePlayerState]);

  // --- Track fullscreen changes (incl. ESC / OS-level exits) ---
  useEffect(() => {
    const handleFsChange = () =>
      updatePlayerState({ isFullscreen: Boolean(document.fullscreenElement) });
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [updatePlayerState]);

  // --- Actions ---
  const play = useCallback(() => {
    void videoRef.current?.play().catch(() => undefined);
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) void video.play().catch(() => undefined);
    else video.pause();
  }, []);

  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      const duration = Number.isFinite(video.duration) ? video.duration : time;
      const next = Math.min(Math.max(0, time), duration);
      video.currentTime = next;
      updatePlayerState({ currentTime: next });
    },
    [updatePlayerState],
  );

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      seekTo((video.currentTime || 0) + delta);
      onSeekRef.current?.(delta);
    },
    [seekTo],
  );

  const restart = useCallback(() => {
    seekTo(0);
    play();
  }, [seekTo, play]);

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.min(Math.max(0, volume), 1);
    video.volume = clamped;
    video.muted = clamped === 0;
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.5;
  }, []);

  const setPlaybackRate = useCallback((rate: PlaybackRate) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void el.requestFullscreen().catch(() => undefined);
    }
  }, []);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isRange =
        target instanceof HTMLInputElement && target.type === 'range';

      switch (event.key) {
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          if (isRange) return;
          event.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
          if (isRange) return;
          event.preventDefault();
          seekBy(10);
          break;
        case 'ArrowUp':
          if (isRange) return;
          event.preventDefault();
          setVolume((videoRef.current?.volume ?? 0) + 0.1);
          break;
        case 'ArrowDown':
          if (isRange) return;
          event.preventDefault();
          setVolume((videoRef.current?.volume ?? 0) - 0.1);
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlay, seekBy, setVolume, toggleFullscreen, toggleMute]);

  const actions: PlayerActions = {
    play,
    pause,
    togglePlay,
    seekTo,
    seekBy,
    restart,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleFullscreen,
  };

  return { videoRef, containerRef, state, actions };
}
