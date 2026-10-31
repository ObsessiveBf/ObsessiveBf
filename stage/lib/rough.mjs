// Hand-drawn helpers: jittered strokes smoothed with Catmull-Rom, so doodles
// look like marker on paper instead of perfect vectors.
import { r } from './svg.mjs';

export function smooth(points, closed = false) {
  const p = closed ? [points[points.length - 1], ...points, points[0], points[1]] : [points[0], ...points, points[points.length - 1]];
  let d = `M${r(p[1][0])} ${r(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2];
    const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6;
    d += `C${r(c1x)} ${r(c1y)} ${r(c2x)} ${r(c2y)} ${r(x2)} ${r(y2)}`;
  }
  return closed ? d + 'Z' : d;
}

export function jitter(points, amt, rand) {
  return points.map(([x, y]) => [x + (rand() - 0.5) * 2 * amt, y + (rand() - 0.5) * 2 * amt]);
}

/** A slightly wobbly line from a to b. */
export function line(a, b, rand, { amt = 1.2, steps = 6 } = {}) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return smooth([pts[0], ...jitter(pts.slice(1, -1), amt, rand), pts[pts.length - 1]]);
}

/** Marker underline with a little hook at the end. */
export function underline(x, y, w, rand) {
  const pts = [];
  const n = 9;
  for (let i = 0; i <= n; i++) pts.push([x + (w * i) / n, y + Math.sin(i * 0.9) * 1.6 + (rand() - 0.5) * 1.5]);
  pts.push([x + w + 8, y - 6]);
  return smooth(pts);
}

/** A loose hand-drawn ellipse that overshoots its start. */
export function circleish(cx, cy, rx, ry, rand) {
  const pts = [];
  const n = 14;
  const a0 = -0.6;
  for (let i = 0; i <= n + 2; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const k = 1 + (rand() - 0.5) * 0.08 + i * 0.006;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smooth(pts);
}

/** Zig-zag scribble used to cross something out. */
export function scribble(x, y, w, h, rand, passes = 5) {
  const pts = [];
  for (let i = 0; i <= passes; i++) {
    pts.push([x + (w * i) / passes + (rand() - 0.5) * 4, y + (i % 2 ? -h / 2 : h / 2) + (rand() - 0.5) * 3]);
  }
  return smooth(pts);
}

export function star(cx, cy, R, rand) {
  const pts = [];
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * R + (rand() - 0.5) * 2, cy + Math.sin(a) * R + (rand() - 0.5) * 2]);
  }
  return 'M' + pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L');
}

export function arrow(x0, y0, x1, y1, rand) {
  const d = line([x0, y0], [x1, y1], rand, { amt: 1.5, steps: 5 });
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const h = 10;
  const a1 = ang + Math.PI * 0.82, a2 = ang - Math.PI * 0.82;
  return `${d}M${r(x1 + Math.cos(a1) * h)} ${r(y1 + Math.sin(a1) * h)}L${r(x1)} ${r(y1)}L${r(x1 + Math.cos(a2) * h)} ${r(y1 + Math.sin(a2) * h)}`;
}
