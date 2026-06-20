/** Supported playback rates surfaced in the speed selector. */
export type PlaybackRate = 0.5 | 1 | 1.25 | 1.5 | 2;

/** A selectable video quality level exposed in the quality menu. */
export interface QualityLevel {
  /** dash.js qualityIndex for manual selection. ABR auto mode is tracked separately. */
  index: number;
  label: string;
}

/** A selectable subtitle/caption track exposed in the subtitles menu. */
export interface SubtitleTrack {
  index: number;
  label: string;
}

/** A selectable audio track exposed alongside the subtitles menu. */
export interface AudioTrack {
  index: number;
  label: string;
}

/** A trick-play thumbnail tile (sprite slice) for a given playback time. */
export interface Thumbnail {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Live snapshot of the underlying <video> element. */
export interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  buffered: number;
  playbackRate: PlaybackRate;
  isFullscreen: boolean;
  isReady: boolean;
}

export interface PlayerActions {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  seekBy: (delta: number) => void;
  restart: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  toggleFullscreen: () => void;
}
