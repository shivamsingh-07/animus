import { FaPause, FaPlay } from 'react-icons/fa';
import { FiMaximize, FiMinimize, FiSettings } from 'react-icons/fi';
import { MdSpeed } from 'react-icons/md';
import { TbRewindBackward10, TbRewindForward10 } from 'react-icons/tb';
import { IconButton } from '@/components/common/IconButton';
import { QUALITY_AUTO, SUBTITLES_OFF } from '@/constants/player';
import { useExclusiveMenu } from '@/hooks';
import type {
  AudioTrack,
  PlaybackRate,
  PlayerActions,
  PlayerState,
  QualityLevel,
  SubtitleTrack,
  Thumbnail,
} from '@/types';
import { formatTime } from '@/utils';
import { PopoverMenu } from '@/components/player/PopoverMenu';
import { SeekBar } from '@/components/player/SeekBar';
import { TracksMenu } from '@/components/player/TracksMenu';
import { VolumeControl } from '@/components/player/VolumeControl';

const PLAYBACK_RATES: PlaybackRate[] = [0.5, 1, 1.25, 1.5, 2];

interface PlayerControlsProps {
  state: PlayerState;
  actions: PlayerActions;
  title: string;
  subtitles: SubtitleTrack[];
  activeSubtitle: number;
  onSelectSubtitle: (index: number) => void;
  audioTracks: AudioTrack[];
  activeAudio: number;
  onSelectAudio: (index: number) => void;
  qualityLevels: QualityLevel[];
  activeQuality: number;
  onSelectQuality: (index: number) => void;
  getThumbnail?: (time: number) => Promise<Thumbnail | null>;
  onActivity?: () => void;
  onScrubbingChange?: (active: boolean) => void;
}

export function PlayerControls({
  state,
  actions,
  title,
  subtitles,
  activeSubtitle,
  onSelectSubtitle,
  audioTracks,
  activeAudio,
  onSelectAudio,
  qualityLevels,
  activeQuality,
  onSelectQuality,
  getThumbnail,
  onActivity,
  onScrubbingChange,
}: PlayerControlsProps) {
  const { activeMenu, toggleMenu, closeMenu } = useExclusiveMenu();

  const subtitleOptions = [SUBTITLES_OFF, ...subtitles.map((track) => track.index)];
  const subtitleLabel = (index: number) =>
    index === SUBTITLES_OFF
      ? 'Off'
      : (subtitles.find((track) => track.index === index)?.label ?? `Track ${index + 1}`);

  const audioOptions = audioTracks.map((track) => track.index);
  const audioLabel = (index: number) =>
    audioTracks.find((track) => track.index === index)?.label ?? `Track ${index + 1}`;

  const hasTracksMenu = subtitles.length > 0 || audioTracks.length > 1;

  const qualityOptions = [QUALITY_AUTO, ...qualityLevels.map((level) => level.index)];
  const qualityLabel = (index: number) =>
    index === QUALITY_AUTO
      ? 'Auto'
      : (qualityLevels.find((level) => level.index === index)?.label ?? `${index}`);
  const hasQualityMenu = qualityLevels.length > 1;

  const { currentTime, duration, buffered, volume, isMuted, isPlaying } = state;
  const safeDuration = duration > 0 ? duration : 0;

  const withActivity = (fn: () => void) => () => {
    onActivity?.();
    fn();
  };

  return (
    <div
      role="toolbar"
      aria-label="Video player controls"
      className="bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-4 pt-16 sm:px-6"
      onPointerMove={onActivity}
      onFocusCapture={onActivity}
    >
      <div className="flex items-center gap-3">
        <span className="w-11 shrink-0 text-right text-xs font-medium tabular-nums text-white/80 sm:text-sm">
          {formatTime(currentTime)}
        </span>

        <SeekBar
          currentTime={currentTime}
          duration={safeDuration}
          buffered={buffered}
          onSeek={actions.seekTo}
          getThumbnail={getThumbnail}
          onActivity={onActivity}
          onScrubbingChange={onScrubbingChange}
        />

        <span className="w-11 shrink-0 text-xs font-medium tabular-nums text-white/80 sm:text-sm">
          {formatTime(safeDuration)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <IconButton label={isPlaying ? 'Pause' : 'Play'} onClick={withActivity(actions.togglePlay)}>
            {isPlaying ? (
              <FaPause className="h-6 w-6" aria-hidden />
            ) : (
              <FaPlay className="h-6 w-6" aria-hidden />
            )}
          </IconButton>

          <IconButton
            label="Rewind 10 seconds"
            onClick={withActivity(() => actions.seekBy(-10))}
          >
            <TbRewindBackward10 className="h-7 w-7" aria-hidden />
          </IconButton>

          <IconButton
            label="Forward 10 seconds"
            onClick={withActivity(() => actions.seekBy(10))}
          >
            <TbRewindForward10 className="h-7 w-7" aria-hidden />
          </IconButton>

          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onToggleMute={actions.toggleMute}
            onVolumeChange={actions.setVolume}
            onActivity={onActivity}
          />
        </div>

        <p className="hidden min-w-0 flex-1 truncate px-3 text-center text-sm font-semibold tracking-wide text-white/90 sm:block sm:text-base">
          {title}
        </p>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <PopoverMenu
            open={activeMenu === 'speed'}
            label="Playback speed"
            title="Playback speed"
            options={PLAYBACK_RATES}
            current={state.playbackRate}
            format={(rate) => (rate === 1 ? 'Normal' : `${rate}x`)}
            onToggle={() => {
              onActivity?.();
              toggleMenu('speed');
            }}
            onSelect={(rate) => {
              onActivity?.();
              actions.setPlaybackRate(rate);
              closeMenu();
            }}
            onClose={closeMenu}
          >
            <MdSpeed className="h-7 w-7" aria-hidden />
          </PopoverMenu>

          {hasTracksMenu && (
            <TracksMenu
              open={activeMenu === 'tracks'}
              onToggle={() => {
                onActivity?.();
                toggleMenu('tracks');
              }}
              onClose={closeMenu}
              subtitleOptions={subtitleOptions}
              activeSubtitle={activeSubtitle}
              subtitleLabel={subtitleLabel}
              onSelectSubtitle={(index) => {
                onActivity?.();
                onSelectSubtitle(index);
              }}
              audioOptions={audioOptions}
              activeAudio={activeAudio}
              audioLabel={audioLabel}
              onSelectAudio={(index) => {
                onActivity?.();
                onSelectAudio(index);
              }}
            />
          )}

          {hasQualityMenu && (
            <PopoverMenu
              open={activeMenu === 'quality'}
              label="Video quality"
              title="Quality"
              options={qualityOptions}
              current={activeQuality}
              format={qualityLabel}
              onToggle={() => {
                onActivity?.();
                toggleMenu('quality');
              }}
              onSelect={(index) => {
                onActivity?.();
                onSelectQuality(index);
                closeMenu();
              }}
              onClose={closeMenu}
            >
              <FiSettings className="h-6 w-6" aria-hidden />
            </PopoverMenu>
          )}

          <IconButton
            label={state.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onClick={withActivity(actions.toggleFullscreen)}
          >
            {state.isFullscreen ? (
              <FiMinimize className="h-6 w-6" aria-hidden />
            ) : (
              <FiMaximize className="h-6 w-6" aria-hidden />
            )}
          </IconButton>
        </div>
      </div>
    </div>
  );
}
