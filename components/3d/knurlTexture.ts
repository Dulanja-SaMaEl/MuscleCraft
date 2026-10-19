import * as THREE from 'three';

/**
 * Generates an in-memory procedural diamond knurling normal map
 * Standard Olympic barbell diamond knurling (cross-hatched pyramids).
 */
export function createKnurlNormalTexture(): THREE.CanvasTexture | null {
  if (typeof window === 'undefined') return null;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Diamond frequency
  const freq = 16;
  const strength = 1.8;

  // Generate heightfield and compute Sobel/gradient normals
  const heightField = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2 * freq;
      const v = (y / size) * Math.PI * 2 * freq;
      // Diamond pattern: combination of diagonal sine waves
      const val = Math.abs(Math.sin(u + v)) * Math.abs(Math.cos(u - v));
      heightField[y * size + x] = Math.pow(val, 0.8);
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;
      const yPrev = (y - 1 + size) % size;
      const yNext = (y + 1) % size;

      const dhdx = (heightField[y * size + xNext] - heightField[y * size + xPrev]) * 0.5 * strength;
      const dhdy = (heightField[yNext * size + x] - heightField[yPrev * size + x]) * 0.5 * strength;

      // Normal vector = [-dhdx, -dhdy, 1] normalized
      let nx = -dhdx;
      let ny = -dhdy;
      let nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * size + x) * 4;
      data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 2);
  texture.needsUpdate = true;

  return texture;
}
