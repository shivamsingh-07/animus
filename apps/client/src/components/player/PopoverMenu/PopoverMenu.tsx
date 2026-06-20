import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import type { ReactNode } from 'react';
import { popoverMotion, spring } from '@/animations';
import { cn } from '@/utils';

export function PopoverMenu<T extends string | number>({
  open,
  title,
  options,
  current,
  format,
  onSelect,
  onToggle,
  onClose,
  children,
  label,
}: {
  open: boolean;
  title: string;
  options: readonly T[];
  current: T;
  format: (value: T) => string;
  onSelect: (value: T) => void;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="relative">
      <motion.button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        onClick={onToggle}
        whileTap={{ scale: 0.88 }}
        transition={spring}
        className={cn(
          'grid h-11 w-11 place-items-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
          open && 'bg-white/15 text-white',
        )}
      >
        {children}
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
            className="popover-shell absolute bottom-12 right-0 z-20 min-w-[9rem]"
          >
            <p className="whitespace-nowrap px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-white/50">
              {title}
            </p>
            {options.map((option) => {
              const selected = option === current;
              return (
                <button
                  key={String(option)}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => onSelect(option)}
                  className="menu-item"
                >
                  <span>{format(option)}</span>
                  {selected && <FiCheck className="h-4 w-4 text-brand-400" aria-hidden />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
