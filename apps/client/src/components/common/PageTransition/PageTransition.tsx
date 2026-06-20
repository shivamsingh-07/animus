import { motion } from 'framer-motion';
import { pageTransitionVariants } from '@/animations';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/** Wraps a page so it fades/slides on route enter and exit (via AnimatePresence). */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.main
      id="main-content"
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.main>
  );
}
