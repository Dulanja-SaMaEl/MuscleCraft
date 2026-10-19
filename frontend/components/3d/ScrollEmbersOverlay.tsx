'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import EmberParticles from './EmberParticles';

interface ScrollEmbersOverlayProps {
  isMobile?: boolean;
  isInView?: boolean;
}

export default function ScrollEmbersOverlay({
  isMobile = false,
  isInView = true,
}: ScrollEmbersOverlayProps) {
  const [canMount, setCanMount] = useState(false);

  useEffect(() => {
    // Delay slightly to prioritize critical DOM and initial frame paint
    const timer = setTimeout(() => setCanMount(true), 120);
    return () => clearTimeout(timer);
  }, []);

  if (!canMount) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[12] overflow-hidden" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={isMobile ? [1, 1] : [1, 1.25]}
        frameloop={isInView ? 'always' : 'never'}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
          depth: false,
          stencil: false,
        }}
        style={{ pointerEvents: 'none', background: 'transparent', width: '100%', height: '100%' }}
      >
        <EmberParticles count={isMobile ? 120 : 380} isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
