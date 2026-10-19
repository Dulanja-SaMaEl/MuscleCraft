'use client';

import React, { useEffect, useRef } from 'react';

export default function HeroScene3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Mouse coordinates with easing
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // 3D Particles / Nodes representing strength vectors and kinetic energy
    const particleCount = 45;
    interface Particle3D {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      color: string;
      alpha: number;
    }

    const particles: Particle3D[] = [];
    const colors = ['#E5A93C', '#F5B84B', '#FFFFFF', '#C2861F', '#D49526'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.2,
        y: (Math.random() - 0.5) * height * 1.2,
        z: Math.random() * 800 + 100,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        vz: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.5 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    // 3D Isometric Geometric Ring rotating in center
    let ringAngle = 0;

    const render = () => {
      // Lerp mouse
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const tiltX = (mouse.x - width / 2) * 0.0008;
      const tiltY = (mouse.y - height / 2) * 0.0008;

      ctx.clearRect(0, 0, width, height);

      const fov = 500;
      const cx = width / 2;
      const cy = height / 2;

      // Draw subtle connecting 3D kinetic lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Move
        p1.x += p1.vx;
        p1.y += p1.vy;
        p1.z += p1.vz;

        // Wrap around bounds
        if (p1.z < 50) p1.z = 800;
        if (p1.z > 800) p1.z = 50;
        if (p1.x < -width) p1.x = width;
        if (p1.x > width) p1.x = -width;
        if (p1.y < -height) p1.y = height;
        if (p1.y > height) p1.y = -height;

        // 3D Projection with mouse parallax
        const scale = fov / (fov + p1.z);
        const projX = cx + (p1.x + (mouse.x - cx) * 0.15) * scale;
        const projY = cy + (p1.y + (mouse.y - cy) * 0.15) * scale;

        // Draw particle
        if (projX > 0 && projX < width && projY > 0 && projY < height) {
          ctx.beginPath();
          ctx.arc(projX, projY, p1.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = p1.color;
          ctx.globalAlpha = p1.alpha * (scale * 0.9);
          ctx.fill();

          // Connect nearby nodes
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const scale2 = fov / (fov + p2.z);
            const projX2 = cx + (p2.x + (mouse.x - cx) * 0.15) * scale2;
            const projY2 = cy + (p2.y + (mouse.y - cy) * 0.15) * scale2;

            const dx = projX - projX2;
            const dy = projY - projY2;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
              ctx.beginPath();
              ctx.moveTo(projX, projY);
              ctx.lineTo(projX2, projY2);
              ctx.strokeStyle = '#E5A93C';
              ctx.globalAlpha = (1 - dist / 110) * 0.18;
              ctx.lineWidth = 0.8 * scale;
              ctx.stroke();
            }
          }
        }
      }

      // Draw subtle 3D rotating metallic rings in the background
      ringAngle += 0.005;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ringAngle * 0.5 + tiltX);
      ctx.scale(1, 0.45); // Isometric elliptical squash

      ctx.beginPath();
      ctx.arc(0, 0, 240, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(229, 169, 60, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 360, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 16]);
      ctx.stroke();

      ctx.restore();
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[2] mix-blend-screen opacity-75"
    />
  );
}
