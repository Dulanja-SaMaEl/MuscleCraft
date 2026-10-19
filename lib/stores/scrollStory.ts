/**
 * Scroll Story State for "The Forge" Persistent 3D Scene
 * High-performance mutable state read directly inside useFrame()
 */

export interface ScrollStoryState {
  progress: number; // 0.0 to 1.0
  plate2Progress: number; // 0 (unloaded) to 1 (slid on)
  plate3Progress: number; // 0 to 1
  plate4Progress: number; // 0 to 1
  activeSection: string;
}

export const scrollStory: ScrollStoryState = {
  progress: 0,
  plate2Progress: 0,
  plate3Progress: 0,
  plate4Progress: 0,
  activeSection: 'hero',
};

export function updateScrollStory(scrollY: number, maxScroll: number) {
  if (maxScroll <= 0) return;
  const p = Math.min(1, Math.max(0, scrollY / maxScroll));
  scrollStory.progress = p;

  // Section 2 (Elevate Journey: 0.10 - 0.28): Plate 2 slides on
  // Smoothly ramps from 0 to 1 as user enters section 2
  const p2Start = 0.08;
  const p2End = 0.22;
  scrollStory.plate2Progress = Math.min(1, Math.max(0, (p - p2Start) / (p2End - p2Start)));

  // Section 3 (What We Offer: 0.25 - 0.45): Plate 3 slides on
  const p3Start = 0.24;
  const p3End = 0.38;
  scrollStory.plate3Progress = Math.min(1, Math.max(0, (p - p3Start) / (p3End - p3Start)));

  // Section 4 / 5 (About & Pricing: 0.42 - 0.65): Plate 4 slides on
  const p4Start = 0.42;
  const p4End = 0.58;
  scrollStory.plate4Progress = Math.min(1, Math.max(0, (p - p4Start) / (p4End - p4Start)));

  if (p < 0.12) {
    scrollStory.activeSection = 'hero';
  } else if (p < 0.26) {
    scrollStory.activeSection = 'elevate';
  } else if (p < 0.42) {
    scrollStory.activeSection = 'offer';
  } else if (p < 0.60) {
    scrollStory.activeSection = 'about';
  } else if (p < 0.78) {
    scrollStory.activeSection = 'pricing';
  } else if (p < 0.88) {
    scrollStory.activeSection = 'reviews';
  } else {
    scrollStory.activeSection = 'cta';
  }
}
