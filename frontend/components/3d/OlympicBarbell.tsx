'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createKnurlNormalTexture } from './knurlTexture';
import { scrollStory } from '@/lib/stores/scrollStory';

interface OlympicBarbellProps {
  mouseParallax?: { x: number; y: number };
}

export default function OlympicBarbell({ mouseParallax }: OlympicBarbellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0.08, y: -0.22, z: 0.04 });

  // References for sliding plates and collars
  const leftPlate2Ref = useRef<THREE.Group>(null);
  const rightPlate2Ref = useRef<THREE.Group>(null);
  const leftPlate3Ref = useRef<THREE.Group>(null);
  const rightPlate3Ref = useRef<THREE.Group>(null);
  const leftPlate4Ref = useRef<THREE.Group>(null);
  const rightPlate4Ref = useRef<THREE.Group>(null);
  const leftCollarRef = useRef<THREE.Group>(null);
  const rightCollarRef = useRef<THREE.Group>(null);

  // Generate knurling normal texture
  const knurlTexture = useMemo(() => createKnurlNormalTexture(), []);

  useEffect(() => {
    return () => {
      if (knurlTexture) knurlTexture.dispose();
    };
  }, [knurlTexture]);

  // Materials
  const materials = useMemo(() => {
    // Knurled grip steel (dark oxide steel with gold rim light catch)
    const knurledSteel = new THREE.MeshStandardMaterial({
      color: 0x222226,
      roughness: 0.42,
      metalness: 0.92,
      normalMap: knurlTexture,
      normalScale: new THREE.Vector2(1.5, 1.5),
    });

    // Smooth shaft steel (center gap and ring marks)
    const smoothSteel = new THREE.MeshStandardMaterial({
      color: 0x2a2a30,
      roughness: 0.25,
      metalness: 0.95,
    });

    // Polished hard chrome sleeves
    const chromeSleeve = new THREE.MeshStandardMaterial({
      color: 0xd8d8de,
      roughness: 0.18,
      metalness: 0.98,
    });

    // Sleeve collar (thick steel stop flange)
    const collarSteel = new THREE.MeshStandardMaterial({
      color: 0x303036,
      roughness: 0.22,
      metalness: 0.94,
    });

    // Competition bumper plate rubber rim & body
    const plateRubber = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.65,
      metalness: 0.2,
    });

    // 15KG Yellow/Gold Competition Bumper Plate Body
    const plateYellowRubber = new THREE.MeshStandardMaterial({
      color: 0x9e7b16,
      roughness: 0.55,
      metalness: 0.35,
    });

    // Competition bumper plate inner steel hub
    const plateHub = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.2,
      metalness: 0.95,
    });

    // Gold accent ring on bumper plate
    const goldAccent = new THREE.MeshStandardMaterial({
      color: 0xd4a359,
      roughness: 0.28,
      metalness: 0.9,
      emissive: 0x553508,
      emissiveIntensity: 0.35,
    });

    // Quick-release barbell collar clamp
    const collarBody = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.35,
      metalness: 0.7,
    });

    return {
      knurledSteel,
      smoothSteel,
      chromeSleeve,
      collarSteel,
      plateRubber,
      plateYellowRubber,
      plateHub,
      goldAccent,
      collarBody,
    };
  }, [knurlTexture]);

  const shaftRadius = 0.042;
  const sleeveRadius = 0.076;
  const sleeveLength = 1.35;
  const collarRadius = 0.125;
  const collarWidth = 0.08;

  // Frame animation: idle breathing float + mouse parallax lerp + dynamic plate positions
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.getElapsedTime();

    // Idle weightless floating heave
    const floatY = Math.sin(t * 0.9) * 0.05;
    const floatRotZ = Math.cos(t * 0.7) * 0.015;

    // Mouse parallax target
    const mx = mouseParallax?.x ?? 0;
    const my = mouseParallax?.y ?? 0;

    // Base rotation adapts to scroll: slight rotation around Y as page scrolls
    const scrollRotY = -0.22 + scrollStory.progress * 0.35;
    const scrollRotX = 0.08 + Math.sin(scrollStory.progress * Math.PI) * 0.08;

    targetRotation.current.y = scrollRotY + mx * 0.18;
    targetRotation.current.x = scrollRotX - my * 0.14;
    targetRotation.current.z = 0.04 + floatRotZ;

    // Smooth lerp
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotation.current.y,
      delta * 4
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotation.current.x,
      delta * 4
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      targetRotation.current.z,
      delta * 4
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      floatY,
      delta * 3
    );

    // ── PROGRESSIVE OVERLOAD PLATE LOADING ──
    // Plate 2 (slides onto sleeve from outer position)
    const p2Progress = scrollStory.plate2Progress;
    const p2TargetLeftX = THREE.MathUtils.lerp(-3.6, -2.23, p2Progress);
    const p2TargetRightX = THREE.MathUtils.lerp(3.6, 2.23, p2Progress);
    if (leftPlate2Ref.current) {
      leftPlate2Ref.current.position.x = THREE.MathUtils.lerp(leftPlate2Ref.current.position.x, p2TargetLeftX, delta * 6);
      leftPlate2Ref.current.visible = p2Progress > 0.01;
    }
    if (rightPlate2Ref.current) {
      rightPlate2Ref.current.position.x = THREE.MathUtils.lerp(rightPlate2Ref.current.position.x, p2TargetRightX, delta * 6);
      rightPlate2Ref.current.visible = p2Progress > 0.01;
    }

    // Plate 3 (slides on next section)
    const p3Progress = scrollStory.plate3Progress;
    const p3TargetLeftX = THREE.MathUtils.lerp(-3.85, -2.38, p3Progress);
    const p3TargetRightX = THREE.MathUtils.lerp(3.85, 2.38, p3Progress);
    if (leftPlate3Ref.current) {
      leftPlate3Ref.current.position.x = THREE.MathUtils.lerp(leftPlate3Ref.current.position.x, p3TargetLeftX, delta * 6);
      leftPlate3Ref.current.visible = p3Progress > 0.01;
    }
    if (rightPlate3Ref.current) {
      rightPlate3Ref.current.position.x = THREE.MathUtils.lerp(rightPlate3Ref.current.position.x, p3TargetRightX, delta * 6);
      rightPlate3Ref.current.visible = p3Progress > 0.01;
    }

    // Plate 4 (15KG Competition Plate)
    const p4Progress = scrollStory.plate4Progress;
    const p4TargetLeftX = THREE.MathUtils.lerp(-4.1, -2.52, p4Progress);
    const p4TargetRightX = THREE.MathUtils.lerp(4.1, 2.52, p4Progress);
    if (leftPlate4Ref.current) {
      leftPlate4Ref.current.position.x = THREE.MathUtils.lerp(leftPlate4Ref.current.position.x, p4TargetLeftX, delta * 6);
      leftPlate4Ref.current.visible = p4Progress > 0.01;
    }
    if (rightPlate4Ref.current) {
      rightPlate4Ref.current.position.x = THREE.MathUtils.lerp(rightPlate4Ref.current.position.x, p4TargetRightX, delta * 6);
      rightPlate4Ref.current.visible = p4Progress > 0.01;
    }

    // Collar position follows outermost loaded plate
    let collarOffset = 2.22;
    if (p4Progress > 0.7) {
      collarOffset = 2.64;
    } else if (p3Progress > 0.7) {
      collarOffset = 2.50;
    } else if (p2Progress > 0.7) {
      collarOffset = 2.35;
    }

    if (leftCollarRef.current) {
      leftCollarRef.current.position.x = THREE.MathUtils.lerp(leftCollarRef.current.position.x, -collarOffset, delta * 6);
    }
    if (rightCollarRef.current) {
      rightCollarRef.current.position.x = THREE.MathUtils.lerp(rightCollarRef.current.position.x, collarOffset, delta * 6);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── BARBELL SHAFT (Along X axis, rotation.z = Math.PI / 2) ── */}

      {/* Center Smooth Segment */}
      <mesh
        position={[0, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.smoothSteel}
      >
        <cylinderGeometry args={[shaftRadius, shaftRadius, 0.45, 32]} />
      </mesh>

      {/* Left Inner Knurl */}
      <mesh
        position={[-0.6, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.knurledSteel}
      >
        <cylinderGeometry args={[shaftRadius, shaftRadius, 0.75, 32]} />
      </mesh>

      {/* Left Smooth Ring / IWF Mark */}
      <mesh
        position={[-1.0, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.smoothSteel}
      >
        <cylinderGeometry args={[shaftRadius, shaftRadius, 0.04, 32]} />
      </mesh>

      {/* Left Outer Knurl */}
      <mesh
        position={[-1.45, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.knurledSteel}
      >
        <cylinderGeometry args={[shaftRadius, shaftRadius, 0.85, 32]} />
      </mesh>

      {/* Right Inner Knurl */}
      <mesh
        position={[0.6, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.knurledSteel}
      >
        <cylinderGeometry args={[shaftRadius, shaftRadius, 0.75, 32]} />
      </mesh>

      {/* Right Smooth Ring / IWF Mark */}
      <mesh
        position={[1.0, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.smoothSteel}
      >
        <cylinderGeometry args={[shaftRadius, shaftRadius, 0.04, 32]} />
      </mesh>

      {/* Right Outer Knurl */}
      <mesh
        position={[1.45, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.knurledSteel}
      >
        <cylinderGeometry args={[shaftRadius, shaftRadius, 0.85, 32]} />
      </mesh>

      {/* ── SLEEVE INNER COLLARS (Flanges) ── */}
      <mesh
        position={[-1.92, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.collarSteel}
      >
        <cylinderGeometry args={[collarRadius, collarRadius, collarWidth, 32]} />
      </mesh>

      <mesh
        position={[1.92, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.collarSteel}
      >
        <cylinderGeometry args={[collarRadius, collarRadius, collarWidth, 32]} />
      </mesh>

      {/* ── ROTATING SLEEVES (Polished hard chrome loadable areas) ── */}
      <mesh
        position={[-1.92 - sleeveLength / 2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.chromeSleeve}
      >
        <cylinderGeometry args={[sleeveRadius, sleeveRadius, sleeveLength, 32]} />
      </mesh>

      <mesh
        position={[-1.92 - sleeveLength, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.goldAccent}
      >
        <cylinderGeometry args={[sleeveRadius * 0.9, sleeveRadius * 0.9, 0.02, 32]} />
      </mesh>

      <mesh
        position={[1.92 + sleeveLength / 2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.chromeSleeve}
      >
        <cylinderGeometry args={[sleeveRadius, sleeveRadius, sleeveLength, 32]} />
      </mesh>

      <mesh
        position={[1.92 + sleeveLength, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.goldAccent}
      >
        <cylinderGeometry args={[sleeveRadius * 0.9, sleeveRadius * 0.9, 0.02, 32]} />
      </mesh>

      {/* ── PLATE SET 1: BASE 20KG BUMPERS (ALWAYS LOADED) ── */}
      <group position={[-2.08, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <cylinderGeometry args={[0.62, 0.62, 0.14, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <torusGeometry args={[0.61, 0.02, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.goldAccent}>
          <torusGeometry args={[0.54, 0.012, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <cylinderGeometry args={[0.42, 0.42, 0.11, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateHub}>
          <cylinderGeometry args={[0.18, 0.18, 0.145, 32]} />
        </mesh>
      </group>

      <group position={[2.08, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <cylinderGeometry args={[0.62, 0.62, 0.14, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <torusGeometry args={[0.61, 0.02, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.goldAccent}>
          <torusGeometry args={[0.54, 0.012, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <cylinderGeometry args={[0.42, 0.42, 0.11, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateHub}>
          <cylinderGeometry args={[0.18, 0.18, 0.145, 32]} />
        </mesh>
      </group>

      {/* ── PLATE SET 2: 20KG BUMPER (SLIDES ON IN SECTION 2: ELEVATE) ── */}
      <group ref={leftPlate2Ref} position={[-3.6, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <cylinderGeometry args={[0.62, 0.62, 0.14, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.goldAccent}>
          <torusGeometry args={[0.54, 0.012, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateHub}>
          <cylinderGeometry args={[0.18, 0.18, 0.145, 32]} />
        </mesh>
      </group>

      <group ref={rightPlate2Ref} position={[3.6, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <cylinderGeometry args={[0.62, 0.62, 0.14, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.goldAccent}>
          <torusGeometry args={[0.54, 0.012, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateHub}>
          <cylinderGeometry args={[0.18, 0.18, 0.145, 32]} />
        </mesh>
      </group>

      {/* ── PLATE SET 3: 20KG BUMPER (SLIDES ON IN SECTION 3: OFFER) ── */}
      <group ref={leftPlate3Ref} position={[-3.85, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <cylinderGeometry args={[0.62, 0.62, 0.14, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.goldAccent}>
          <torusGeometry args={[0.54, 0.012, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateHub}>
          <cylinderGeometry args={[0.18, 0.18, 0.145, 32]} />
        </mesh>
      </group>

      <group ref={rightPlate3Ref} position={[3.85, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateRubber}>
          <cylinderGeometry args={[0.62, 0.62, 0.14, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.goldAccent}>
          <torusGeometry args={[0.54, 0.012, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateHub}>
          <cylinderGeometry args={[0.18, 0.18, 0.145, 32]} />
        </mesh>
      </group>

      {/* ── PLATE SET 4: 15KG YELLOW/GOLD BUMPER (SLIDES ON IN ABOUT/PRICING) ── */}
      <group ref={leftPlate4Ref} position={[-4.1, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateYellowRubber}>
          <cylinderGeometry args={[0.55, 0.55, 0.12, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.goldAccent}>
          <torusGeometry args={[0.48, 0.01, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateHub}>
          <cylinderGeometry args={[0.18, 0.18, 0.125, 32]} />
        </mesh>
      </group>

      <group ref={rightPlate4Ref} position={[4.1, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateYellowRubber}>
          <cylinderGeometry args={[0.55, 0.55, 0.12, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.goldAccent}>
          <torusGeometry args={[0.48, 0.01, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.plateHub}>
          <cylinderGeometry args={[0.18, 0.18, 0.125, 32]} />
        </mesh>
      </group>

      {/* ── DYNAMIC QUICK-RELEASE BARBELL COLLARS ── */}
      <group ref={leftCollarRef} position={[-2.22, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.collarBody}>
          <cylinderGeometry args={[0.12, 0.12, 0.07, 24]} />
        </mesh>
        <mesh position={[0, 0.13, 0]} material={materials.goldAccent}>
          <boxGeometry args={[0.05, 0.06, 0.03]} />
        </mesh>
      </group>

      <group ref={rightCollarRef} position={[2.22, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.collarBody}>
          <cylinderGeometry args={[0.12, 0.12, 0.07, 24]} />
        </mesh>
        <mesh position={[0, 0.13, 0]} material={materials.goldAccent}>
          <boxGeometry args={[0.05, 0.06, 0.03]} />
        </mesh>
      </group>
    </group>
  );
}
