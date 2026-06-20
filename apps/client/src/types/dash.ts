import type { Thumbnail } from './player';

export type DashMediaTrack = {
  id?: string;
  index?: number;
  lang?: string;
  labels?: { text?: string }[];
  roles?: string[];
};

export type DashBitrateInfo = {
  bitrate?: number;
  width?: number;
  height?: number;
  qualityIndex: number;
};

/** Payload emitted by dash.js CUE_ENTER when dispatchForManualRendering is enabled. */
export type DashTextCue = {
  cueID?: string;
  text?: string;
  cueHTMLElement?: HTMLElement | null;
};

export type DashPlayer = {
  initialize: (view: HTMLVideoElement, source: string, autoPlay: boolean) => void;
  destroy: () => void;
  updateSettings: (settings: unknown) => void;
  enableText: (enabled: boolean) => void;
  setTextTrack: (index: number) => void;
  getTracksFor: (type: string) => DashMediaTrack[];
  getCurrentTrackFor: (type: string) => DashMediaTrack | null;
  setCurrentTrack: (track: DashMediaTrack) => void;
  getBitrateInfoListFor: (type: string) => DashBitrateInfo[];
  setQualityFor: (type: string, index: number, forceReplace?: boolean) => void;
  provideThumbnail: (time: number, callback: (thumbnail: Thumbnail | null) => void) => void;
  on: (type: string, listener: (event: unknown) => void) => void;
};

export type DashMediaPlayer = {
  create: () => DashPlayer;
};

export type DashModule = {
  MediaPlayer?: () => DashMediaPlayer;
  default?: { MediaPlayer: () => DashMediaPlayer };
};
