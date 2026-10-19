import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural diamond knurling bump texture generated on canvas
function createKnurlTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base metallic neutral gray
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);

  // Cross-hatch diamond knurling relief
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ffffff';

  const step = 8;
  // +45 deg diagonal lines
  for (let x = -128; x < 256; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 128, 128);
    ctx.stroke();
  }
  // -45 deg diagonal lines
  for (let x = -128; x < 256; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + 128, 0);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(32, 6);
  texture.needsUpdate = true;
  return texture;
}

// Generate cross-section points for LatheGeometry bumper plate
function createPlateLatheGeometry(radius, thickness) {
  const points = [];
  const r_inner = 0.108; // fit sleeve 0.10
  const r_hub = 0.25;
  const r_web = radius * 0.78;
  const R = radius;
  const halfRim = thickness / 2;
  const halfWeb = thickness * 0.35;
  const halfHub = halfRim * 0.95;
  const b = 0.018; // bevel

  points.push(new THREE.Vector2(r_inner, halfHub));
  points.push(new THREE.Vector2(r_hub, halfHub));
  points.push(new THREE.Vector2(r_hub, halfWeb));
  points.push(new THREE.Vector2(r_web, halfWeb));
  points.push(new THREE.Vector2(r_web, halfRim - b));
  points.push(new THREE.Vector2(r_web + b, halfRim));
  points.push(new THREE.Vector2(R - b, halfRim));
  points.push(new THREE.Vector2(R, halfRim - b));
  points.push(new THREE.Vector2(R, -halfRim + b));
  points.push(new THREE.Vector2(R - b, -halfRim));
  points.push(new THREE.Vector2(r_web + b, -halfRim));
  points.push(new THREE.Vector2(r_web, -halfRim + b));
  points.push(new THREE.Vector2(r_web, -halfWeb));
  points.push(new THREE.Vector2(r_hub, -halfWeb));
  points.push(new THREE.Vector2(r_hub, -halfHub));
  points.push(new THREE.Vector2(r_inner, -halfHub));
  points.push(new THREE.Vector2(r_inner, halfHub));

  const geo = new THREE.LatheGeometry(points, 48);
  // Rotate lathe geometry from Y-axis rotation to X-axis horizontal alignment
  geo.rotateZ(Math.PI / 2);
  return geo;
}

function BumperPlate({ x, radius, thickness, isDimmed }) {
  const plateGeo = useMemo(() => createPlateLatheGeometry(radius, thickness), [radius, thickness]);

  return (
    <group position={[x, 0, 0]}>
      {/* Matte Rubber Main Plate Body */}
      <mesh geometry={plateGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={isDimmed ? '#141418' : '#1c1c22'}
          roughness={0.78}
          metalness={0.2}
          clearcoat={0.15}
          clearcoatRoughness={0.6}
        />
      </mesh>

      {/* Thin Gold Inlay Ring on outer plate face (+X side) */}
      <mesh position={[thickness * 0.36, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[radius * 0.52, 0.008, 16, 48]} />
        <meshPhysicalMaterial
          color="#D4A359"
          emissive="#7A5210"
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.95}
          clearcoat={0.4}
        />
      </mesh>

      {/* Thin Gold Inlay Ring on inner plate face (-X side) */}
      <mesh position={[-thickness * 0.36, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[radius * 0.52, 0.008, 16, 48]} />
        <meshPhysicalMaterial
          color="#D4A359"
          emissive="#7A5210"
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.95}
          clearcoat={0.4}
        />
      </mesh>

      {/* Precision Hub Center Ring (Metallic) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, thickness * 1.02, 32]} />
        <meshPhysicalMaterial
          color="#d8dce6"
          metalness={0.98}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

export default function Barbell({ isMobile = false }) {
  const groupRef = useRef();

  // Create knurling texture procedurally
  const knurlTexture = useMemo(() => createKnurlTexture(), []);

  // Plate specifications for the 4 plates per side
  const platesConfig = useMemo(() => [
    { offset: 0.08, radius: 0.82, thickness: 0.11 }, // 25kg / outer 1
    { offset: 0.20, radius: 0.82, thickness: 0.10 }, // 20kg / outer 2
    { offset: 0.31, radius: 0.78, thickness: 0.085 }, // 15kg / outer 3
    { offset: 0.40, radius: 0.72, thickness: 0.07 }, // 10kg / outer 4
  ], []);

  // Floating & rotation animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Subtle sinusoidal float
    groupRef.current.position.y = (isMobile ? -0.28 : 0.05) + Math.sin(t * 0.8) * 0.08;

    // Slow, stately rotation around Y and slight tilt
    groupRef.current.rotation.y = (isMobile ? 0.06 : -0.52) + Math.sin(t * 0.4) * 0.06;
    groupRef.current.rotation.z = (isMobile ? 0 : 0.04) + Math.cos(t * 0.5) * 0.02;
    groupRef.current.rotation.x = isMobile ? 0.1 : 0.16;
  });

  // Base placement:
  // Desktop: barbell shifted to the right (x=2.9), leaving left side clear for text
  // Mobile: barbell centred behind text, slightly pushed back & scaled down
  const basePosition = isMobile ? [0, -0.28, -1.3] : [2.85, 0.05, 0.1];
  const baseScale = isMobile ? 0.72 : 0.94;

  return (
    <group ref={groupRef} position={basePosition} scale={baseScale}>
      {/* ── 1. CENTRAL STEEL SHAFT (CYLINDER WITH PROCEDURAL KNURLING BUMP) ── */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.048, 0.048, 3.4, 32, 1, false]} />
        <meshPhysicalMaterial
          color="#d2d6de"
          metalness={0.96}
          roughness={0.35}
          bumpMap={knurlTexture}
          bumpScale={0.04}
          clearcoat={0.25}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Smooth Center Ring on Shaft (Smooth, unknurled center indicator) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.049, 0.049, 0.28, 32]} />
        <meshPhysicalMaterial
          color="#d8dce4"
          metalness={0.95}
          roughness={0.22}
        />
      </mesh>

      {/* ── 2. TWO SLEEVES (LEFT & RIGHT) ── */}
      {/* Right Sleeve */}
      <group position={[1.7, 0, 0]}>
        {/* Sleeve Inner Shoulder Stop Flange */}
        <mesh position={[0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.155, 0.155, 0.07, 32]} />
          <meshPhysicalMaterial
            color="#e2e6ee"
            metalness={0.96}
            roughness={0.28}
          />
        </mesh>

        {/* Sleeve Rotating Tube */}
        <mesh position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.10, 0.10, 1.15, 32]} />
          <meshPhysicalMaterial
            color="#e6eaf2"
            metalness={0.96}
            roughness={0.28}
            clearcoat={0.3}
          />
        </mesh>

        {/* Sleeve End Cap */}
        <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.098, 0.098, 0.02, 32]} />
          <meshPhysicalMaterial
            color="#D4A359"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Left Sleeve */}
      <group position={[-1.7, 0, 0]}>
        {/* Sleeve Inner Shoulder Stop Flange */}
        <mesh position={[-0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.155, 0.155, 0.07, 32]} />
          <meshPhysicalMaterial
            color="#e2e6ee"
            metalness={0.96}
            roughness={0.28}
          />
        </mesh>

        {/* Sleeve Rotating Tube */}
        <mesh position={[-0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.10, 0.10, 1.15, 32]} />
          <meshPhysicalMaterial
            color="#e6eaf2"
            metalness={0.96}
            roughness={0.28}
            clearcoat={0.3}
          />
        </mesh>

        {/* Sleeve End Cap */}
        <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.098, 0.098, 0.02, 32]} />
          <meshPhysicalMaterial
            color="#D4A359"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* ── 3. FOUR PLATES PER SIDE (LATHEGEOMETRY, BEVELED, MATTE RUBBER, THIN GOLD INLAY) ── */}
      {/* Right Side Plates */}
      {platesConfig.map((cfg, idx) => (
        <BumperPlate
          key={`right-plate-${idx}`}
          x={1.78 + cfg.offset}
          radius={cfg.radius}
          thickness={cfg.thickness}
          isDimmed={isMobile}
        />
      ))}

      {/* Left Side Plates */}
      {platesConfig.map((cfg, idx) => (
        <BumperPlate
          key={`left-plate-${idx}`}
          x={-(1.78 + cfg.offset)}
          radius={cfg.radius}
          thickness={cfg.thickness}
          isDimmed={isMobile}
        />
      ))}

      {/* ── 4. COMPETITION COLLARS (LOCKING THE PLATES OUTSIDE THE 4TH PLATE) ── */}
      {/* Right Collar */}
      <group position={[2.26, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.055, 32]} />
          <meshPhysicalMaterial
            color="#222226"
            metalness={0.88}
            roughness={0.4}
          />
        </mesh>
        {/* Collar Gold Locking Lever */}
        <mesh position={[0, 0.16, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.035, 0.12, 0.03]} />
          <meshPhysicalMaterial
            color="#D4A359"
            metalness={0.92}
            roughness={0.25}
          />
        </mesh>
      </group>

      {/* Left Collar */}
      <group position={[-2.26, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.055, 32]} />
          <meshPhysicalMaterial
            color="#222226"
            metalness={0.88}
            roughness={0.4}
          />
        </mesh>
        {/* Collar Gold Locking Lever */}
        <mesh position={[0, 0.16, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.035, 0.12, 0.03]} />
          <meshPhysicalMaterial
            color="#D4A359"
            metalness={0.92}
            roughness={0.25}
          />
        </mesh>
      </group>
    </group>
  );
}
