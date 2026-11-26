import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MuscleCraft — Build Discipline. Sculpt Strength.',
    short_name: 'MuscleCraft',
    description:
      'Premier strength facility, BurnZone conditioning, and 90 Days Better Me 1-on-1 personal coaching with Coach Adeesha Kumarasingha in Sri Lanka.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080809',
    theme_color: '#ba1a1a',
    orientation: 'portrait-primary',
    categories: ['fitness', 'health', 'lifestyle', 'sports'],
    icons: [
      {
        src: '/images/musclecraft-emblem.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
