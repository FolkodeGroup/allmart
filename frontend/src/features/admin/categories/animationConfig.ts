import type { Variants } from 'framer-motion';

export const fadeSlideIn: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(2px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 16,
    filter: 'blur(2px)',
    transition: {
      duration: 0.22,
      ease: 'easeIn',
    },
  },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' } },
};
