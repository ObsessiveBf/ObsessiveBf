// Text -> SVG path engine. Every word in the README art is real vector outlines,
// so nothing depends on fonts being available (GitHub serves SVGs as images).
import opentype from 'opentype.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(here, '..', 'fonts');

const FILES = {
  dela: 'DelaGothicOne-Regular.ttf',
  mono: 'SpaceMono-Regular.ttf',
  monoB: 'SpaceMono-Bold.ttf',
  dot: 'DotGothic16-Regular.ttf',
  hand: 'YuseiMagic-Regular.ttf',
};

// when a glyph is missing in the requested font, try these in order
const FALLBACK = ['dela', 'dot', 'hand', 'monoB', 'mono'];

const cache = new Map();
export function font(key) {
  if (!cache.has(key)) {
    const file = path.join(FONT_DIR, FILES[key]);
    const buf = fs.readFileSync(file);
    cache.set(key, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return cache.get(key);
}

const missingReport = new Set();
export function missingGlyphs() { return [...missingReport]; }

// which characters each font actually drew (used to subset the bundled fonts)
const used = {};
export function usedChars() { return Object.fromEntries(Object.entries(used).map(([k, v]) => [k, [...v].join('')])); }

const r1 = (v) => Math.round(v * 10) / 10;

// opentype.js 2.0's toPathData occasionally emits NaN for perfectly finite
// coordinates, so serialize the commands ourselves.
const n1 = (v) => { const k = Math.round(v * 10) / 10; return Object.is(k, -0) ? '0' : String(k); };
export function pathData(p) {
  let d = '';
  for (const c of p.commands) {
    if (c.type === 'M' || c.type === 'L') d += `${c.type}${n1(c.x)} ${n1(c.y)}`;
    else if (c.type === 'Q') d += `Q${n1(c.x1)} ${n1(c.y1)} ${n1(c.x)} ${n1(c.y)}`;
    else if (c.type === 'C') d += `C${n1(c.x1)} ${n1(c.y1)} ${n1(c.x2)} ${n1(c.y2)} ${n1(c.x)} ${n1(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}

function pickGlyph(ch, key) {
  const order = [key, ...FALLBACK.filter((k) => k !== key)];
  for (const k of order) {
    const f = font(k);
    const idx = f.charToGlyphIndex(ch);
    if (idx > 0) { (used[k] ??= new Set()).add(ch); return { f, k, g: f.glyphs.get(idx) }; }
  }
  if (ch !== ' ') missingReport.add(ch);
  const f = font(key);
  return { f, k: key, g: f.glyphs.get(Math.max(0, f.charToGlyphIndex(' '))) };
}

/** Lay out a single line. Returns glyph placements and total advance width. */
export function layout(str, { font: key = 'mono', size = 16, tracking = 0, kerning = true } = {}) {
  const chars = [...String(str)];
  const out = [];
  let x = 0;
  let prev = null;
  for (const ch of chars) {
    const p = pickGlyph(ch, key);
    const scale = size / p.f.unitsPerEm;
    if (kerning && prev && prev.k === p.k) {
      let kv = 0;
      try { kv = p.f.getKerningValue(prev.g, p.g); } catch { kv = 0; }
      if (Number.isFinite(kv)) x += kv * scale;
    }
    out.push({ ...p, ch, x, scale });
    x += p.g.advanceWidth * scale + tracking;
    prev = p;
  }
  const width = chars.length ? x - tracking : 0;
  return { glyphs: out, width };
}

export function measure(str, opts) { return layout(str, opts).width; }

/**
 * Text as one path. anchor: start | middle | end.
 * Returns { d, width, x0 } where x0 is the left edge actually used.
 */
export function textPath(str, { x = 0, y = 0, anchor = 'start', ...opts } = {}) {
  const { glyphs, width } = layout(str, opts);
  const x0 = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  const size = opts.size ?? 16;
  let d = '';
  for (const g of glyphs) {
    if (g.ch === ' ') continue;
    d += pathData(g.g.getPath(x0 + g.x, y, size));
  }
  return { d, width, x0 };
}

/** Convenience: an SVG <path> element string. */
export function text(str, opts = {}) {
  const { fill = 'currentColor', attrs = '', ...rest } = opts;
  const { d } = textPath(str, rest);
  if (!d) return '';
  return `<path${fill ? ` fill="${fill}"` : ''}${attrs ? ' ' + attrs : ''} d="${d}"/>`;
}

/** Per-character paths (for staggered animations). */
export function chars(str, opts = {}) {
  const { x = 0, y = 0, anchor = 'start', ...rest } = opts;
  const { glyphs, width } = layout(str, rest);
  const x0 = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  const size = rest.size ?? 16;
  return glyphs
    .filter((g) => g.ch !== ' ')
    .map((g) => ({ ch: g.ch, x: r1(x0 + g.x), w: r1(g.g.advanceWidth * g.scale), d: pathData(g.g.getPath(x0 + g.x, y, size)) }));
}

/** Greedy word wrap to maxWidth. */
export function wrap(str, maxWidth, opts) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (!cur || measure(t, opts) <= maxWidth) cur = t;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Shrink font size until the string fits maxWidth. */
export function fit(str, maxWidth, opts) {
  let size = opts.size ?? 16;
  while (size > 6 && measure(str, { ...opts, size }) > maxWidth) size -= 0.5;
  return size;
}
