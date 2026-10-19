export const MOTION_TOKENS = {
  ease: {
    luxury: 'power2.out',
    cinematic: 'power3.out',
    expoOut: 'expo.out',
    power3Out: 'power3.out',
    power2Out: 'power2.out',
    expoInOut: 'expo.inOut',
    backOut: 'power2.out', // Smooth luxury deceleration without cartoon bounce
  },
  duration: {
    fast: 0.8,
    base: 1.2,
    slow: 1.5,
    graceful: 1.8,
    preloader: 1.0,
  },
  stagger: {
    tight: 0.08,
    base: 0.12,
    loose: 0.16,
  },
  distance: {
    desktop: 30,
    mobile: 15,
  },
} as const;
