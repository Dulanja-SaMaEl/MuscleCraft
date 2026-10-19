'use client';

import React from 'react';

export default function StudioLighting() {
  return (
    <>
      {/* Deep dark studio ambient light */}
      <ambientLight color="#101016" intensity={0.65} />

      {/* Main warm key light */}
      <directionalLight
        position={[4, 6, 4]}
        intensity={2.2}
        color="#FFF4E6"
        castShadow={false}
      />

      {/* Primary molten-gold rim light (grazes the knurling and plate edges from behind) */}
      <directionalLight
        position={[-4, 2, -4]}
        intensity={4.2}
        color="#D4A359"
        castShadow={false}
      />

      {/* Secondary gold rim fill from opposite low quadrant */}
      <directionalLight
        position={[4, -1, -3]}
        intensity={2.0}
        color="#F5B84B"
        castShadow={false}
      />

      {/* Overhead dramatic athletic spotlight focused on the center knurl */}
      <spotLight
        position={[0, 6, 2.5]}
        target-position={[0, 0, 0]}
        intensity={2.0}
        color="#FFF9EE"
        angle={0.65}
        penumbra={0.8}
      />

      {/* Low molten-gold floor glow point */}
      <pointLight
        position={[0, -1.2, 0.5]}
        intensity={1.8}
        distance={6}
        color="#E5A93C"
      />
    </>
  );
}
