export const chromeSlideTransition = { duration: 0.25 } as const;

export const chromeTopMotion = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: chromeSlideTransition,
} as const;

export const chromeBottomMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: chromeSlideTransition,
} as const;
