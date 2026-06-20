import { useCallback, useEffect, useRef, useState } from 'react';
import { ABR_SETTINGS, QUALITY_AUTO } from '@/constants/player';
import type {
  AudioTrack,
  DashMediaTrack,
  DashModule,
  DashPlayer,
  DashTextCue,
  QualityLevel,
  SubtitleTrack,
  Thumbnail,
} from '@/types';

const LANGUAGE_NAMES =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'language' })
    : null;

function labelForTrack(track: DashMediaTrack, index: number, fallbackPrefix: string): string {
  const explicit = track.labels?.find((label) => label.text)?.text;
  if (explicit) return explicit;
  if (track.lang) {
    const name = LANGUAGE_NAMES?.of(track.lang);
    return name && name !== track.lang ? name : track.lang.toUpperCase();
  }
  return `${fallbackPrefix} ${index + 1}`;
}

// Standard resolution tiers: [minimum long edge in px, label]. Matching on the
// longer dimension keeps labels correct for ultrawide/cinematic renditions
// (e.g. 1920x872 -> 1080p instead of "872p").
const RESOLUTION_TIERS: [number, string][] = [
  [3600, '2160p'],
  [2400, '1440p'],
  [1800, '1080p'],
  [1200, '720p'],
  [800, '480p'],
  [600, '360p'],
  [400, '240p'],
];

function qualityLabel(width?: number, height?: number, bitrate?: number): string {
  const longEdge = Math.max(width ?? 0, height ?? 0);
  const tier = RESOLUTION_TIERS.find(([min]) => longEdge >= min);
  if (tier) return tier[1];
  if (longEdge > 0) return '144p';
  return bitrate ? `${Math.round(bitrate / 1000)} kbps` : '';
}

export function useDashPlayer(
  videoUrl: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onError: () => void,
) {
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState(-1);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [activeAudio, setActiveAudio] = useState(0);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [activeQuality, setActiveQuality] = useState(QUALITY_AUTO);
  const [subtitleCue, setSubtitleCue] = useState('');

  const dashRef = useRef<DashPlayer | null>(null);
  const audioInfosRef = useRef<DashMediaTrack[]>([]);
  const activeCuesRef = useRef(new Map<string, string>());

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    let player: { destroy: () => void } | null = null;

    import('dashjs')
      .then((mod) => {
        if (destroyed || !videoRef.current) return;
        const dashjs = mod as unknown as DashModule;
        const createMediaPlayer = dashjs.MediaPlayer ?? dashjs.default?.MediaPlayer;
        if (!createMediaPlayer) throw new Error('dash.js MediaPlayer is unavailable');
        const instance = createMediaPlayer().create();
        instance.initialize(videoRef.current, videoUrl, false);
        // Render subtitles ourselves via CUE_ENTER/CUE_EXIT so we fully control
        // their position and stacking (the built-in renderer paints behind the chrome).
        instance.updateSettings({
          streaming: { text: { defaultEnabled: false, dispatchForManualRendering: true } },
        });
        instance.updateSettings(ABR_SETTINGS);

        const flushCue = () =>
          setSubtitleCue(Array.from(activeCuesRef.current.values()).filter(Boolean).join('\n'));

        instance.on('cueEnter', (event) => {
          const cue = event as DashTextCue;
          if (!cue.cueID) return;
          const text = (cue.text ?? cue.cueHTMLElement?.textContent ?? '').trim();
          activeCuesRef.current.set(cue.cueID, text);
          flushCue();
        });

        instance.on('cueExit', (event) => {
          const { cueID } = event as DashTextCue;
          if (cueID) activeCuesRef.current.delete(cueID);
          flushCue();
        });

        instance.on('allTextTracksAdded', () => {
          const tracks = instance.getTracksFor('text');
          setSubtitles(
            tracks.map((track, index) => ({
              index,
              label: labelForTrack(track, index, 'Subtitle'),
            })),
          );
        });

        instance.on('streamInitialized', () => {
          const tracks = instance.getTracksFor('audio');
          audioInfosRef.current = tracks;
          setAudioTracks(
            tracks.map((track, index) => ({
              index,
              label: labelForTrack(track, index, 'Audio'),
            })),
          );
          const current = instance.getCurrentTrackFor('audio');
          const currentIndex = current
            ? tracks.findIndex(
                (track) =>
                  (current.id != null && track.id === current.id) ||
                  (current.index != null && track.index === current.index),
              )
            : 0;
          setActiveAudio(currentIndex >= 0 ? currentIndex : 0);

          const bitrates = instance.getBitrateInfoListFor('video');
          setQualityLevels(
            bitrates
              .map((info) => ({
                index: info.qualityIndex,
                longEdge: Math.max(info.width ?? 0, info.height ?? 0),
                bitrate: info.bitrate ?? 0,
                label: qualityLabel(info.width, info.height, info.bitrate),
              }))
              .sort((a, b) => b.longEdge - a.longEdge || b.bitrate - a.bitrate)
              .map(({ index, label }) => ({ index, label })),
          );
          setActiveQuality(QUALITY_AUTO);
        });

        dashRef.current = instance;
        player = instance;
      })
      .catch(() => onError());

    return () => {
      destroyed = true;
      dashRef.current = null;
      audioInfosRef.current = [];
      activeCuesRef.current.clear();
      setSubtitles([]);
      setActiveSubtitle(-1);
      setAudioTracks([]);
      setActiveAudio(0);
      setQualityLevels([]);
      setActiveQuality(QUALITY_AUTO);
      setSubtitleCue('');
      try {
        player?.destroy();
      } catch {
        /* dash.js teardown is best-effort */
      }
    };
  }, [videoUrl, videoRef, onError]);

  const selectSubtitle = useCallback((index: number) => {
    const dash = dashRef.current;
    if (!dash) return;
    try {
      // Drop any active cues so a previous track never lingers; dash re-dispatches
      // the current cue for the new track on the next processing tick.
      activeCuesRef.current.clear();
      setSubtitleCue('');
      if (index < 0) {
        dash.enableText(false);
      } else {
        dash.setTextTrack(index);
        dash.enableText(true);
      }
      setActiveSubtitle(index);
    } catch {
      /* text track may not be ready yet */
    }
  }, []);

  const selectAudio = useCallback((index: number) => {
    const dash = dashRef.current;
    const track = audioInfosRef.current[index];
    if (!dash || !track) return;
    try {
      dash.setCurrentTrack(track);
      setActiveAudio(index);
    } catch {
      /* audio track switch is best-effort */
    }
  }, []);

  const selectQuality = useCallback((index: number) => {
    const dash = dashRef.current;
    if (!dash) return;
    try {
      if (index < 0) {
        dash.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
      } else {
        dash.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
        dash.setQualityFor('video', index, true);
      }
      setActiveQuality(index);
    } catch {
      /* quality switch is best-effort */
    }
  }, []);

  const requestThumbnail = useCallback(
    (time: number) =>
      new Promise<Thumbnail | null>((resolve) => {
        const dash = dashRef.current;
        if (!dash) {
          resolve(null);
          return;
        }
        try {
          dash.provideThumbnail(time, (thumbnail) => resolve(thumbnail ?? null));
        } catch {
          resolve(null);
        }
      }),
    [],
  );

  return {
    subtitles,
    activeSubtitle,
    audioTracks,
    activeAudio,
    qualityLevels,
    activeQuality,
    subtitleCue,
    selectSubtitle,
    selectAudio,
    selectQuality,
    requestThumbnail,
  };
}
