'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import OlympicBarbell from './OlympicBarbell';
import EmberParticles from './EmberParticles';
import StudioLighting from './StudioLighting';
import StudioFloor from './StudioFloor';
import { scrollStory, updateScrollStory } from '@/lib/stores/scrollStory';

function CameraController({ mousePos }: { mousePos: { x: number; y: number } }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0.25, 4.8));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    const p = scrollStory.progress;

    // Cinematic scroll choreography: Camera dollies along the barbell
    if (p < 0.14) {
      // 1. Hero: centered wide view
      targetPos.current.set(0, 0.25, 4.8);
      targetLook.current.set(0, 0, 0);
    } else if (p < 0.28) {
      // 2. Elevate: dolly left to left sleeve and knurl collar
      const t = (p - 0.14) / (0.28 - 0.14);
      targetPos.current.set(
        THREE.MathUtils.lerp(0, -1.5, t),
        THREE.MathUtils.lerp(0.25, 0.18, t),
        THREE.MathUtils.lerp(4.8, 3.4, t)
      );
      targetLook.current.set(
        THREE.MathUtils.lerp(0, -0.8, t),
        THREE.MathUtils.lerp(0, 0.05, t),
        0
      );
    } else if (p < 0.44) {
      // 3. Offer: dolly right across the bar to right sleeve
      const t = (p - 0.28) / (0.44 - 0.28);
      targetPos.current.set(
        THREE.MathUtils.lerp(-1.5, 1.4, t),
        THREE.MathUtils.lerp(0.18, 0.12, t),
        THREE.MathUtils.lerp(3.4, 3.2, t)
      );
      targetLook.current.set(
        THREE.MathUtils.lerp(-0.8, 0.7, t),
        0,
        0
      );
    } else if (p < 0.62) {
      // 4. About: low athletic angle looking up at loaded competition bar
      const t = (p - 0.44) / (0.62 - 0.44);
      targetPos.current.set(
        THREE.MathUtils.lerp(1.4, 0, t),
        THREE.MathUtils.lerp(0.12, -0.4, t),
        THREE.MathUtils.lerp(3.2, 4.2, t)
      );
      targetLook.current.set(
        THREE.MathUtils.lerp(0.7, 0, t),
        0.1,
        0
      );
    } else if (p < 0.80) {
      // 5. Pricing: centered behind flagship card with glowing plates
      const t = (p - 0.62) / (0.80 - 0.62);
      targetPos.current.set(
        0,
        THREE.MathUtils.lerp(-0.4, 0.05, t),
        THREE.MathUtils.lerp(4.2, 4.5, t)
      );
      targetLook.current.set(0, 0, 0);
    } else {
      // 6. Reviews / CTA / Footer: stable forge perspective
      targetPos.current.set(0, 0.2, 4.8);
      targetLook.current.set(0, 0, 0);
    }

    // Add subtle mouse parallax offset to camera position
    const camTargetX = targetPos.current.x + mousePos.x * 0.12;
    const camTargetY = targetPos.current.y - mousePos.y * 0.08;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, delta * 3);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, delta * 3);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetPos.current.z, delta * 3);

    camera.lookAt(targetLook.current);
  });

  return null;
}

export default function ForgeCanvas() {
  const [mounted, setMounted] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);

    // 1. Detect WebGL support
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    // 2. Detect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
    }

    // 3. Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 4. Tab visibility
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Mouse parallax listener
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 6. Scroll listener to update scrollStory
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      updateScrollStory(scrollY, maxScroll);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // SSR or fallback when WebGL is unavailable / user requested reduced motion
  if (!mounted || !hasWebGL || reducedMotion) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(229, 169, 60, 0.12) 0%, rgba(18, 18, 22, 0.8) 50%, #080809 90%)',
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-3/4 max-w-4xl h-3 bg-gradient-to-r from-transparent via-gold to-transparent rounded-full blur-[1px]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0.25, 4.8], fov: 46 }}
        dpr={[1, 1.5]}
        frameloop={isTabVisible ? 'always' : 'never'}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
      >
        {/* Dynamic camera scroll choreography */}
        <CameraController mousePos={mousePos} />

        {/* Studio Lighting */}
        <StudioLighting />

        {/* Olympic Barbell with Progressive Overload Plate Loading */}
        <OlympicBarbell mouseParallax={mousePos} />

        {/* Rising GPU Ember Particles */}
        <EmberParticles isMobile={isMobile} />

        {/* Dark Reflective Studio Floor */}
        <StudioFloor />
      </Canvas>

      {/* Atmospheric depth vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(8, 8, 9, 0.3) 0%, rgba(8, 8, 9, 0.75) 70%, #080809 100%)',
        }}
      />
    </div>
  );
}
