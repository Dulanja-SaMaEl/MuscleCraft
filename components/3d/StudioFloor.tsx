'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function StudioFloor() {
  // Procedural gym rubber mat / dark polished concrete texture
  const floorTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark charcoal gym flooring with subtle grain
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, size, size);

    // Subtle rubber grain
    const imgData = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Gym platform tile seams
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }, []);

  return (
    <group position={[0, -1.85, 0]}>
      {/* Main reflective studio floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#08080a"
          map={floorTexture || undefined}
          roughness={0.32}
          metalness={0.78}
        />
      </mesh>

      {/* Center lifting platform accent line (competition boundary) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[2.8, 2.82, 64]} />
        <meshBasicMaterial
          color="#E5A93C"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
