'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Barbell from './Barbell';
import Embers from './Embers';

// Camera controller with damped pointer parallax
function CameraController({ isMobile }) {
  useFrame((state, delta) => {
    const pX = state.pointer.x;
    const pY = state.pointer.y;

    // Desktop target camera position vs Mobile
    const targetX = isMobile ? pX * 0.25 : pX * 0.65;
    const targetY = isMobile ? pY * 0.2 : pY * 0.35;
    const targetZ = isMobile ? 5.2 : 4.4;

    const dt = Math.min(delta, 0.1);

    // Smoothly damp camera position toward pointer
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2.5, dt);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2.5, dt);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2.5, dt);

    // Look slightly towards barbell center
    const lookTargetX = isMobile ? 0 : 0.8;
    state.camera.lookAt(lookTargetX, 0, 0);
  });

  return null;
}

// Scene lighting without external HDRI: Environment + Lightformers + Floor
function SceneContent({ isMobile }) {
  // Track rolling WebGL rendering FPS directly inside the Three.js render loop
  const fpsStats = useRef({ frames: 0, lastTime: performance.now(), current: 60 });

  useFrame((state, delta) => {
    fpsStats.current.frames++;
    const now = performance.now();
    const elapsed = now - fpsStats.current.lastTime;
    if (elapsed >= 500) {
      fpsStats.current.current = Math.round((fpsStats.current.frames * 1000) / elapsed);
      fpsStats.current.frames = 0;
      fpsStats.current.lastTime = now;
      if (typeof window !== 'undefined') {
        window.__HERO_3D_FPS__ = fpsStats.current.current;
      }
    }
  });

  return (
    <>
      <CameraController isMobile={isMobile} />

      {/* ── AMBIENT & DIRECTIONAL ACCENT LIGHTS ── */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[-6, 6, 4]}
        intensity={1.2}
        color="#cde2f5"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        position={[8, 3, 3]}
        intensity={3.5}
        color="#D4A359"
        angle={0.6}
        penumbra={0.8}
      />

      {/* ── DREI ENVIRONMENT WITH LIGHTFORMERS (NO EXTERNAL HDRI) ── */}
      <Environment resolution={256}>
        {/* 1. Gold rim light from the right */}
        <Lightformer
          form="rect"
          intensity={6.5}
          color="#D4A359"
          position={[10, 2, 2]}
          scale={[12, 6, 1]}
          target={[0, 0, 0]}
        />
        {/* 2. Cool soft key light from the top-left */}
        <Lightformer
          form="rect"
          intensity={3.5}
          color="#a8cbf0"
          position={[-10, 8, 5]}
          scale={[14, 7, 1]}
          target={[0, 0, 0]}
        />
        {/* 3. Soft warm fill from below */}
        <Lightformer
          form="circle"
          intensity={1.8}
          color="#f3d8a8"
          position={[2, -3, 3]}
          scale={8}
        />
      </Environment>

      {/* ── PROCEDURAL OLYMPIC BARBELL ── */}
      <Barbell isMobile={isMobile} />

      {/* ── ~600 GOLD EMBERS ── */}
      <Embers count={600} />

      {/* ── DARK, GLOSSY FLOOR USING DREI MESHREFLECTORMATERIAL ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          blur={[0, 0]}
          resolution={256}
          mixBlur={0}
          mixStrength={25}
          roughness={0.4}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#080809"
          metalness={0.7}
          mirror={0.5}
        />
      </mesh>

      {/* ── POST-PROCESSING: BLOOM (SUBTLE) & VIGNETTE (DISABLED ON MOBILE) ── */}
      {!isMobile && (
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom
            luminanceThreshold={0.72}
            luminanceSmoothing={0.3}
            intensity={0.35}
          />
          <Vignette eskil={false} offset={0.18} darkness={0.82} />
        </EffectComposer>
      )}
    </>
  );
}

export default function ForgeScene() {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // 1. Detect screen size (desktop vs mobile)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Pause rendering when the hero is off-screen (IntersectionObserver)
  useEffect(() => {
    const target = containerRef.current?.parentElement || containerRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ pointerEvents: 'none', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneContent isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
