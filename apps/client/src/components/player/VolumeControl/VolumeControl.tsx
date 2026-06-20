import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IoVolumeHigh,
  IoVolumeLow,
  IoVolumeMedium,
  IoVolumeMute,
} from 'react-icons/io5';
import { IconButton } from '@/components/common/IconButton';
import { cn } from '@/utils';

export function VolumeControl({
  volume,
  isMuted,
  onToggleMute,
  onVolumeChange,
  onActivity,
}: {
  volume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onActivity?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const isExpanded = open || dragging;

  const displayVolume = isMuted ? 0 : volume;
  const volumePercent = displayVolume * 100;

  const VolumeIcon =
    isMuted || volume === 0
      ? IoVolumeMute
      : volume < 0.34
        ? IoVolumeLow
        : volume < 0.67
          ? IoVolumeMedium
          : IoVolumeHigh;

  const bump = () => onActivity?.();
  const endDrag = () => setDragging(false);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('pointerup', endDrag);
    return () => window.removeEventListener('pointerup', endDrag);
  }, [dragging]);

  return (
    <div
      className="flex items-center"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => {
        if (!dragging) setOpen(false);
      }}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node) && !dragging) {
          setOpen(false);
        }
      }}
    >
      <IconButton
        label={isMuted ? 'Unmute' : 'Mute'}
        onClick={() => {
          bump();
          onToggleMute();
        }}
      >
        <VolumeIcon className="h-7 w-7" aria-hidden />
      </IconButton>

      <motion.div
        className={cn('overflow-hidden', !isExpanded && 'pointer-events-none')}
        initial={false}
        animate={{ width: isExpanded ? 88 : 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        aria-hidden={!isExpanded}
      >
        <div className="group/volbar relative ml-2 flex h-11 w-20 items-center px-2">
          <div className="relative h-1.5 w-full rounded-full bg-white/25">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              style={{ width: `${volumePercent}%` }}
            />
            <div
              className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
              style={{ left: `${volumePercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step="any"
            value={displayVolume}
            tabIndex={isExpanded ? 0 : -1}
            onChange={(event) => {
              bump();
              onVolumeChange(Number(event.target.value));
            }}
            onPointerDown={() => setDragging(true)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={(event) => {
              bump();
              const up = event.key === 'ArrowUp' || event.key === 'ArrowRight';
              const down = event.key === 'ArrowDown' || event.key === 'ArrowLeft';
              if (!up && !down) return;
              event.preventDefault();
              const steps = displayVolume * 10;
              const next = up ? Math.floor(steps + 1e-6) + 1 : Math.ceil(steps - 1e-6) - 1;
              onVolumeChange(Math.min(1, Math.max(0, next / 10)));
            }}
            aria-label="Volume"
            className="volume-slider absolute inset-0 h-full w-full cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          />
        </div>
      </motion.div>
    </div>
  );
}
