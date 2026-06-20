import type { Transition } from 'framer-motion';

export const spring: Transition = { type: 'spring', stiffness: 260, damping: 22 };

export const tap = { scale: 0.96 } as const;
