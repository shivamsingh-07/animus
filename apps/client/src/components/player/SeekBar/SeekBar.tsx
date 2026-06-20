import { useEffect, useRef, useState } from 'react';
import type { Thumbnail } from '@/types';
import { formatTime } from '@/utils';

const THUMBNAIL_PREVIEW_WIDTH = 300;

export function SeekBar({
  currentTime,
  duration,
  buffered,
  onSeek,
  getThumbnail,
  onActivity,
  onScrubbingChange,
}: {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
  getThumbnail?: (time: number) => Promise<Thumbnail | null>;
  onActivity?: () => void;
  onScrubbingChange?: (active: boolean) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastReqSecond = useRef(-1);
  const [hover, setHover] = useState<{ time: number; x: number; width: number } | null>(null);
  const [thumb, setThumb] = useState<Thumbnail | null>(null);

  // Tell the player to hide captions while a thumbnail preview is on screen,
  // otherwise the caption text paints over the (lower-stacked) preview.
  const previewVisible = Boolean(hover && thumb);
  useEffect(() => {
    onScrubbingChange?.(previewVisible);
  }, [previewVisible, onScrubbingChange]);
  useEffect(() => () => onScrubbingChange?.(false), [onScrubbingChange]);

  const playedPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? Math.min((buffered / duration) * 100, 100) : 0;

  const updateHover = (clientX: number) => {
    const el = trackRef.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const time = ratio * duration;
    setHover({ time, x: ratio * rect.width, width: rect.width });
    if (getThumbnail) {
      const second = Math.floor(time);
      if (second !== lastReqSecond.current) {
        lastReqSecond.current = second;
        void getThumbnail(time).then(setThumb);
      }
    }
  };

  const clearHover = () => {
    setHover(null);
    setThumb(null);
    lastReqSecond.current = -1;
  };

  const scale = thumb && thumb.width ? THUMBNAIL_PREVIEW_WIDTH / thumb.width : 1;
  const previewW = thumb ? thumb.width * scale : 0;
  const clampedX = hover ? Math.min(Math.max(hover.x, previewW / 2), hover.width - previewW / 2) : 0;

  return (
    <div
      ref={trackRef}
      className="group/seek relative flex h-5 flex-1 items-center"
      onPointerMove={(event) => updateHover(event.clientX)}
      onPointerLeave={clearHover}
    >
      {hover && thumb && (
        <div
          className="pointer-events-none absolute bottom-6 z-30 flex -translate-x-1/2 flex-col items-center gap-1"
          style={{ left: clampedX }}
        >
          <div
            className="overflow-hidden rounded-xl border border-white/25 shadow-card"
            style={{ width: thumb.width * scale, height: thumb.height * scale }}
          >
            <div
              style={{
                width: thumb.width,
                height: thumb.height,
                backgroundImage: `url("${thumb.url}")`,
                backgroundPosition: `-${thumb.x}px -${thumb.y}px`,
                backgroundRepeat: 'no-repeat',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
          <span className="rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
            {formatTime(hover.time)}
          </span>
        </div>
      )}

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/25 transition-all duration-150 group-hover/seek:h-2.5">
        <div
          className="absolute inset-y-0 left-0 bg-white/40"
          style={{ width: `${bufferedPercent}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-accent-gradient"
          style={{ width: `${playedPercent}%` }}
        />
      </div>
      <div
        className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-brand-400 shadow-glow-sm transition-transform duration-150 group-hover/seek:scale-100"
        style={{ left: `${playedPercent}%` }}
      />
      <input
        type="range"
        min={0}
        max={duration || 0}
        step="any"
        value={Math.min(currentTime, duration)}
        onChange={(event) => {
          onActivity?.();
          onSeek(Number(event.target.value));
        }}
        disabled={!duration}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
      />
    </div>
  );
}
