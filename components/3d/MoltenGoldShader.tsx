'use client';

import React, { useEffect, useRef } from 'react';

export default function MoltenGoldShader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    let animationFrameId: number;
    let isVisible = true;

    // IntersectionObserver to pause shader when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Molten gold GLSL fragment shader with turbulent domain warping and sparks
    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      // Simplex-inspired hash & noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      // Fractional Brownian Motion (FBM)
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 4; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        float t = u_time * 0.28;

        // Domain warping for viscous liquid flow
        vec2 q = vec2(fbm(p + vec2(0.0, t * 0.4)), fbm(p + vec2(5.2, 1.3)));
        vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7 - t * 0.2, 9.2)), fbm(p + 4.0 * q + vec2(8.3, 2.8 + t * 0.3)));
        float f = fbm(p + 4.0 * r);

        // Molten-gold color palette
        vec3 darkMolten = vec3(0.05, 0.03, 0.01);
        vec3 emberGold   = vec3(0.90, 0.66, 0.24); // Reference gold #E5A93C
        vec3 intenseGold = vec3(1.00, 0.85, 0.40);
        vec3 whiteHot    = vec3(1.00, 0.98, 0.88);

        vec3 col = mix(darkMolten, emberGold, clamp((f * f) * 4.0, 0.0, 1.0));
        col = mix(col, intenseGold, clamp(length(q), 0.0, 1.0));
        col = mix(col, whiteHot, clamp(length(r.x), 0.0, 1.0) * 0.45);

        // Vignette at edges to blend seamlessly into page background
        float edgeVignette = smoothstep(0.0, 0.4, uv.y) * smoothstep(1.0, 0.6, uv.y);
        col *= edgeVignette * 0.85;

        gl_FragColor = vec4(col, 0.92);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      // Cap DPR at 1.5 for performance
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();

    const render = () => {
      if (isVisible) {
        const currentTime = (performance.now() - startTime) * 0.001;

        gl.useProgram(program);
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(timeLocation, currentTime);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-70"
      aria-hidden="true"
    />
  );
}
