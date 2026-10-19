'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface EmberParticlesProps {
  count?: number;
  isMobile?: boolean;
  velocityRef?: React.RefObject<number>;
}

export default function EmberParticles({ count, isMobile = false }: EmberParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Soft glowing circle sprite texture for particles
  const spriteTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(245, 184, 75, 0.85)');
    gradient.addColorStop(0.6, 'rgba(229, 169, 60, 0.35)');
    gradient.addColorStop(1, 'rgba(229, 169, 60, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    return () => {
      if (spriteTexture) spriteTexture.dispose();
    };
  }, [spriteTexture]);

  const particleCount = useMemo(() => {
    if (count !== undefined) return count;
    return isMobile ? 90 : 320;
  }, [count, isMobile]);

  // Position, velocity, phase arrays
  const [positions, colors, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    // Warm ember color palette: Molten Gold, Burning Amber, White Spark
    const colorChoices = [
      new THREE.Color('#E5A93C'), // Reference gold
      new THREE.Color('#F5B84B'), // Light gold
      new THREE.Color('#FF7A1A'), // Forge fire amber
      new THREE.Color('#FF4500'), // Hot ember
      new THREE.Color('#FFF5DC'), // Incandescent spark
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Spread across studio floor and volume
      pos[i3] = (Math.random() - 0.5) * 12; // X
      pos[i3 + 1] = Math.random() * 7 - 2; // Y (-2 to 5)
      pos[i3 + 2] = (Math.random() - 0.5) * 8 - 1; // Z

      // Upward drift with slight random horizontal draft
      vel[i3] = (Math.random() - 0.5) * 0.008; // vx
      vel[i3 + 1] = 0.008 + Math.random() * 0.018; // vy
      vel[i3 + 2] = (Math.random() - 0.5) * 0.008; // vz

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }

    return [pos, col, vel];
  }, [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positionAttr.array as Float32Array;
    const time = state.clock.getElapsedTime();

    // Drive ember speed and brightness from Lenis / ScrollTrigger velocity (clamped)
    let velocityBoost = 1.0;
    try {
      if (typeof window !== 'undefined') {
        const stAny = ScrollTrigger as unknown as { getVelocity?: () => number };
        const vel = Math.abs(typeof stAny.getVelocity === 'function' ? stAny.getVelocity() : 0);
        velocityBoost = 1.0 + Math.min(vel / 650, 3.5);
      }
    } catch {
      velocityBoost = 1.0;
    }

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Upward drift accelerated by scroll velocity
      posArray[i3 + 1] += velocities[i3 + 1] * velocityBoost;

      // Organic turbulent swirling
      posArray[i3] += Math.sin(time * 1.5 + i * 0.5) * 0.003 + velocities[i3];
      posArray[i3 + 2] += Math.cos(time * 1.2 + i * 0.7) * 0.003 + velocities[i3 + 2];

      // Respawn at bottom floor when rising past top ceiling
      if (posArray[i3 + 1] > 5.5) {
        posArray[i3 + 1] = -2.0;
        posArray[i3] = (Math.random() - 0.5) * 12;
        posArray[i3 + 2] = (Math.random() - 0.5) * 8 - 1;
      }
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isMobile ? 0.08 : 0.095}
        map={spriteTexture || undefined}
        vertexColors
        transparent
        opacity={0.88}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
