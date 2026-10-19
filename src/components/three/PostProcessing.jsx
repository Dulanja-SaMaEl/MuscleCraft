'use client';

import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export default function PostProcessing() {
  return (
    <EffectComposer multisampling={0} disableNormalPass>
      <Bloom
        luminanceThreshold={0.72}
        luminanceSmoothing={0.3}
        intensity={0.35}
      />
      <Vignette eskil={false} offset={0.18} darkness={0.82} />
    </EffectComposer>
  );
}
