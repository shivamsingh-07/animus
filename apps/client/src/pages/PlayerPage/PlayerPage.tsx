import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaPause, FaPlay } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import {
  IoVolumeHigh,
  IoVolumeMute,
} from 'react-icons/io5';
import { TbRewindBackward10, TbRewindForward10 } from 'react-icons/tb';
import { useNavigate, useParams } from 'react-router-dom';
import { IconButton } from '@/components/common/IconButton';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PauseOverlay } from '@/components/player/PauseOverlay';
import { PlayerControls } from '@/components/player/PlayerControls';
import {
  useDashPlayer,
  useDocumentTitle,
  useIdleChrome,
  useMovie,
  usePlaybackFeedback,
  usePlayer,
  useVideoStatus,
  type FeedbackKind,
} from '@/hooks';
import type { Movie } from '@/types';
import { feedbackMotion, chromeBottomMotion, chromeTopMotion } from '@/animations';
import { cn, formatMovieTitle } from '@/utils';

function FeedbackIcon({ kind }: { kind: FeedbackKind }) {
  const className = 'h-12 w-12';
  switch (kind) {
    case 'play':
      return <FaPlay className="ml-1 h-9 w-9" aria-hidden />;
    case 'pause':
      return <FaPause className="h-9 w-9" aria-hidden />;
    case 'forward':
      return <TbRewindForward10 className={className} aria-hidden />;
    case 'backward':
      return <TbRewindBackward10 className={className} aria-hidden />;
    case 'mute':
      return <IoVolumeMute className={className} aria-hidden />;
    case 'unmute':
      return <IoVolumeHigh className={className} aria-hidden />;
    default:
      return null;
  }
}

function PlayerStage({ movie }: { movie: Movie }) {
  const navigate = useNavigate();
  const autoplayTried = useRef(false);
  const onSeekRef = useRef<(delta: number) => void>(() => { });
  const [isScrubbing, setIsScrubbing] = useState(false);

  const { videoRef, containerRef, state, actions } = usePlayer({
    onSeek: (delta) => onSeekRef.current(delta),
  });

  const { isBuffering, videoError, setVideoError } = useVideoStatus(videoRef);
  const { feedback, showFeedback } = usePlaybackFeedback(
    state.isReady,
    state.isPlaying,
    state.isMuted,
  );
  onSeekRef.current = (delta) => showFeedback(delta < 0 ? 'backward' : 'forward');

  const paused = state.isReady && !state.isPlaying && !videoError;
  const { isUserActive, handleActivity } = useIdleChrome(paused);

  const dash = useDashPlayer(
    movie.manifest_url,
    videoRef,
    useCallback(() => setVideoError(true), [setVideoError]),
  );

  useEffect(() => {
    if (!state.isReady || autoplayTried.current) return;
    autoplayTried.current = true;
    void videoRef.current?.play().catch(() => undefined);
  }, [state.isReady, videoRef]);

  const handleResume = useCallback(() => {
    if (state.duration > 0 && state.currentTime >= state.duration - 0.4) {
      actions.restart();
    } else {
      actions.play();
    }
  }, [actions, state.currentTime, state.duration]);

  const overlayVisible = paused && !isUserActive;
  const chromeVisible = isUserActive || overlayVisible;
  const controlsVisible = state.isReady && isUserActive;
  const hideCursor = state.isPlaying && !isUserActive;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleActivity}
      onPointerDown={handleActivity}
      className={cn(
        'relative h-dvh w-full select-none overflow-hidden bg-black',
        hideCursor && 'cursor-none',
      )}
    >
      <video
        ref={videoRef}
        poster={movie.backdrop}
        playsInline
        preload="auto"
        aria-label={`${movie.title} video player`}
        onClick={actions.togglePlay}
        className="h-full w-full bg-black object-contain"
      />

      {dash.subtitleCue && !videoError && !overlayVisible && !isScrubbing && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-4 transition-[padding] duration-300 ease-out',
            controlsVisible ? 'pb-32' : 'pb-20',
          )}
        >
          <p className="max-w-[min(92%,52rem)] whitespace-pre-line text-balance text-center font-semibold leading-snug text-white text-[clamp(1.125rem,2.6vw,2rem)] [text-shadow:0_0_2px_rgba(0,0,0,0.95),0_2px_4px_rgba(0,0,0,0.9),0_4px_14px_rgba(0,0,0,0.6)]">
            {dash.subtitleCue}
          </p>
        </div>
      )}

      {!state.isReady && !videoError && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <Loader />
        </div>
      )}

      {isBuffering && state.isReady && !overlayVisible && !videoError && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader />
        </div>
      )}

      {videoError && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/80 px-6 text-center">
          <ErrorState
            variant="inline"
            title="This title can’t be played"
            message="There was a problem streaming the video. Please try again later."
            className="bg-transparent py-0"
            action={
              <PrimaryButton to={`/movie/${movie.id}`} className="px-5 py-2">
                Back to details
              </PrimaryButton>
            }
          />
        </div>
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {feedback &&
          `${feedback.kind === 'forward' ? 'Forward 10 seconds' : feedback.kind === 'backward' ? 'Rewind 10 seconds' : feedback.kind}`}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.id}
            {...feedbackMotion}
            className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-2"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md">
              <FeedbackIcon kind={feedback.kind} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chromeVisible && !videoError && (
          <motion.div
            {...chromeTopMotion}
            className="absolute inset-x-0 top-0 z-30 flex items-center bg-gradient-to-b from-black/70 to-transparent px-3 pb-10 pt-4 sm:px-6"
          >
            <IconButton
              label="Go back"
              onClick={() => navigate(-1)}
              className="text-white"
            >
              <FiArrowLeft className="h-6 w-6" aria-hidden />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            {...chromeBottomMotion}
            className="absolute inset-x-0 bottom-0 z-30"
          >
            <PlayerControls
              state={state}
              actions={actions}
              title={formatMovieTitle(movie)}
              subtitles={dash.subtitles}
              activeSubtitle={dash.activeSubtitle}
              onSelectSubtitle={dash.selectSubtitle}
              audioTracks={dash.audioTracks}
              activeAudio={dash.activeAudio}
              onSelectAudio={dash.selectAudio}
              qualityLevels={dash.qualityLevels}
              activeQuality={dash.activeQuality}
              onSelectQuality={dash.selectQuality}
              getThumbnail={dash.requestThumbnail}
              onActivity={handleActivity}
              onScrubbingChange={setIsScrubbing}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {overlayVisible && (
          <PauseOverlay movie={movie} onResume={handleResume} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlayerPage() {
  const movieId = useParams().id;
  const { data: movie, loading, error } = useMovie(movieId);

  useDocumentTitle(movie);

  if (loading) {
    return <Loader fullscreen />;
  }

  if (error || !movie) {
    return (
      <ErrorState
        variant="page"
        title="This title isn’t available"
        message={error?.message ?? 'We couldn’t load this video.'}
        action={<PrimaryButton to="/">Back to browse</PrimaryButton>}
      />
    );
  }

  return (
    <main id="main-content">
      <PlayerStage movie={movie} />
    </main>
  );
}
