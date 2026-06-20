import { motion } from 'framer-motion';
import { spring } from '@/animations';
import type { ReactNode } from 'react';
import { cn } from '@/utils';

export interface IconButtonProps {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
}

export function IconButton({
  label,
  onClick,
  children,
  className,
  type = 'button',
}: IconButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.88 }}
      transition={spring}
      className={cn(
        'grid h-11 w-11 place-items-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
