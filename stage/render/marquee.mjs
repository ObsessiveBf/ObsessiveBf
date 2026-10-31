// LED marquee: the scrolling sign outside the live house. The text scrolls
// under a static grid of LED dots (an SVG mask), so letters light up dot by dot.
import { layout } from '../lib/text.mjs';
import { pathData } from '../lib/text.mjs';
import { svgDoc, r } from '../lib/svg.mjs';

const LED = { amber: '#FFB347', pink: '#FF5FAE', mint: '#7FE0B8', white: '#FFE9F3', blue: '#8C96FF' };

export function renderMarquee(cfg) {
  const W = 1000, H = 92;
  const fx = 26, fy = 22, fw = W - 52, fh = 48; // LED field
  const pitch = 4.4, dotR = 1.75;
  const size = 34;
  const baseline = fy + fh / 2 + size * 0.36;

  // lay out all segments as one strip, colour by segment
  let x = 0;
  const groups = [];
  const segs = [...cfg.marquee, { t: '   ', c: 'amber' }];
  for (const s of segs) {
    const { glyphs, width } = layout(s.t, { font: 'dela', size, tracking: 1.5 });
    let d = '';
    for (const g of glyphs) if (g.ch.trim()) d += pathData(g.g.getPath(x + g.x, baseline, size));
    if (d) groups.push(`<path fill="${LED[s.c] ?? s.c}" d="${d}"/>`);
    x += width + 1.5;
  }
  const stripW = Math.ceil(x);
  const speed = 78; // units per second
  const dur = (stripW / speed).toFixed(1);
  const copies = Math.ceil(fw / stripW) + 1;
  const uses = Array.from({ length: copies + 1 }, (_, k) => `<use href="#strip" x="${k * stripW}"/>`).join('');

  const defs = `
    <g id="strip">${groups.join('')}</g>
    <pattern id="dots" x="${fx}" y="${fy}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse"><circle cx="${pitch / 2}" cy="${pitch / 2}" r="${dotR}" fill="#fff"/></pattern>
    <pattern id="off" x="${fx}" y="${fy}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse"><circle cx="${pitch / 2}" cy="${pitch / 2}" r="${dotR}" fill="#2a1d24"/></pattern>
    <mask id="led" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#dots)"/></mask>
    <clipPath id="fieldclip"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}"/></clipPath>
    <filter id="bloom" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a55"/><stop offset=".5" stop-color="#1f1f26"/><stop offset="1" stop-color="#3a3a44"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  `;
  const css = `
    .scroll{animation:scroll ${dur}s linear infinite}
    @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-${stripW}px)}}
    @media (prefers-reduced-motion:reduce){.scroll{animation:none}}
  `;
  const body = `
    <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="14" fill="url(#frame)"/>
    <rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="9" fill="#0a090b"/>
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#off)"/>
    <g clip-path="url(#fieldclip)">
      <g filter="url(#bloom)" opacity=".75"><g mask="url(#led)"><g transform="translate(${fx} 0)"><g class="scroll">${uses}</g></g></g></g>
      <g mask="url(#led)"><g transform="translate(${fx} 0)"><g class="scroll">${uses}</g></g></g>
    </g>
    <rect x="12" y="12" width="${W - 24}" height="${(H - 24) / 2}" rx="9" fill="url(#glass)"/>
    ${[[17, H / 2], [W - 17, H / 2]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="3" fill="#5a5a66"/><path d="M${cx - 1.8} ${cy}h3.6" stroke="#222" stroke-width="1"/>`).join('')}
  `;
  const plain = cfg.marquee.map((s) => s.t).join('').replace(/\s+/g, ' ').trim();
  return svgDoc({ w: W, h: H, title: plain, defs, css, body });
}
