import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Create a circular soft glow sprite texture procedurally
function createSoftParticleTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 240, 200, 1)');
  grad.addColorStop(0.2, 'rgba(212, 163, 89, 0.8)');
  grad.addColorStop(0.5, 'rgba(180, 120, 40, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function Embers({ count = 600 }) {
  const pointsRef = useRef();

  // Create particle texture once
  const particleTexture = useMemo(() => createSoftParticleTexture(), []);

  // Initialize particle positions, velocities, and drift parameters
  const [positions, speeds, phases, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const phs = new Float32Array(count);
    const scl = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread across the hero volume
      pos[i * 3 + 0] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = Math.random() * 8 - 2.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;

      spd[i] = 0.3 + Math.random() * 0.7; // gentle upward velocity
      phs[i] = Math.random() * Math.PI * 2;
      scl[i] = 0.04 + Math.random() * 0.05;
    }
    return [pos, spd, phs, scl];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const array = posAttr.array;
    const time = state.clock.getElapsedTime();

    // Bounded delta to prevent jumps if tab loses focus
    const dt = Math.min(delta, 0.1);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Drift upward
      array[idx + 1] += speeds[i] * dt;

      // Slight turbulence / horizontal wander noise
      array[idx + 0] += Math.sin(time * 0.7 + phases[i]) * 0.006;
      array[idx + 2] += Math.cos(time * 0.5 + phases[i]) * 0.006;

      // Wrap-around when floating above the camera frustum
      if (array[idx + 1] > 5.5) {
        array[idx + 1] = -2.8;
        array[idx + 0] = (Math.random() - 0.5) * 14;
        array[idx + 2] = (Math.random() - 0.5) * 8;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#D4A359"
        size={0.065}
        map={particleTexture}
        transparent={true}
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
}
