import { AnimatePresence, motion } from 'framer-motion';
import { MdOutlineSubtitles, MdSubtitles } from 'react-icons/md';
import { SUBTITLES_OFF } from '@/constants/player';
import { popoverMotion, spring } from '@/animations';
import { cn } from '@/utils';
import { TrackList } from './TrackList';

export function TracksMenu({
  open,
  onToggle,
  onClose,
  subtitleOptions,
  activeSubtitle,
  subtitleLabel,
  onSelectSubtitle,
  audioOptions,
  activeAudio,
  audioLabel,
  onSelectAudio,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  subtitleOptions: number[];
  activeSubtitle: number;
  subtitleLabel: (index: number) => string;
  onSelectSubtitle: (index: number) => void;
  audioOptions: number[];
  activeAudio: number;
  audioLabel: (index: number) => string;
  onSelectAudio: (index: number) => void;
}) {
  const showAudio = audioOptions.length > 1;
  const subtitlesActive = activeSubtitle !== SUBTITLES_OFF;

  return (
    <div className="relative">
      <motion.button
        type="button"
        aria-label="Subtitles and audio"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Subtitles and audio"
        onClick={onToggle}
        whileTap={{ scale: 0.88 }}
        transition={spring}
        className={cn(
          'grid h-11 w-11 place-items-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
          open && 'bg-white/15 text-white',
        )}
      >
        {subtitlesActive ? (
          <MdSubtitles className="h-7 w-7" aria-hidden />
        ) : (
          <MdOutlineSubtitles className="h-7 w-7" aria-hidden />
        )}
      </motion.button>

      {open && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={onClose}
          className="fixed inset-0 z-10 cursor-default"
        />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            {...popoverMotion}
            className="popover-shell absolute bottom-12 right-0 z-20 flex"
          >
            {showAudio && (
              <>
                <TrackList
                  title="Audio"
                  options={audioOptions}
                  current={activeAudio}
                  format={audioLabel}
                  onSelect={onSelectAudio}
                />
                <div className="mx-1.5 w-px self-stretch bg-white/10" aria-hidden />
              </>
            )}
            <TrackList
              title="Subtitles"
              options={subtitleOptions}
              current={activeSubtitle}
              format={subtitleLabel}
              onSelect={onSelectSubtitle}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
