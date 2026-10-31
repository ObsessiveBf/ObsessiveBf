// Section headers: a strip of fluorescent spike tape with the section name in
// marker, plus a dashed cue line. Transparent background, mid-gray accents so it
// reads on both GitHub themes.
import { text, measure } from '../lib/text.mjs';
import { svgDoc, rng, r } from '../lib/svg.mjs';
import { C } from '../lib/palette.mjs';

function torn(x0, y0, x1, y1, rand, teeth = 7) {
  // jagged left/right ends like hand-torn tape
  const pts = [];
  const h = y1 - y0;
  pts.push([x0 + rand() * 4, y0]);
  pts.push([x1 - rand() * 4, y0]);
  for (let i = 1; i < teeth; i++) pts.push([x1 + (i % 2 ? 4 + rand() * 4 : -3 - rand() * 3), y0 + (h * i) / teeth]);
  pts.push([x1 - rand() * 3, y1]);
  pts.push([x0 + rand() * 3, y1]);
  for (let i = teeth - 1; i > 0; i--) pts.push([x0 + (i % 2 ? -4 - rand() * 4 : 3 + rand() * 3), y0 + (h * i) / teeth]);
  return 'M' + pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L') + 'Z';
}

export function renderTape({ no, title, jp, en, color = C.pink, ink = C.ink, seed = 1, tilt = -1.4 }) {
  const W = 1000, H = 92;
  const rand = rng(seed);
  const titleSize = 40;
  const noW = measure(no, { font: 'monoB', size: 17, tracking: 1 });
  const tW = measure(title, { font: 'hand', size: titleSize });
  const x0 = 10, padL = 24, gap = 14, padR = 30;
  const tapeW = padL + noW + gap + tW + padR;
  const y0 = 18, y1 = 74;
  const cy = (y0 + y1) / 2;

  const tape = torn(x0, y0, x0 + tapeW, y1, rand);
  const textX = x0 + padL;
  const baseline = cy + 13;

  const lineX0 = x0 + tapeW + 26;
  const label = `${jp}  ·  ${en}`;
  const labW = measure(jp, { font: 'dot', size: 17 }) + measure('  ·  ' + en, { font: 'monoB', size: 14, tracking: 0.6 });
  const lineX1 = W - 12 - labW - 18;

  const defs = `
    <pattern id="weave${seed}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="6" height="6" fill="none"/><rect width="1.2" height="6" fill="#000" opacity=".07"/>
    </pattern>
    <linearGradient id="sheen${seed}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".28"/>
      <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".12"/>
    </linearGradient>
    <filter id="ts${seed}" x="-5%" y="-30%" width="110%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".22"/></filter>
  `;

  const css = `.cue{stroke-dasharray:2 9;animation:cue 1.6s linear infinite}@keyframes cue{to{stroke-dashoffset:-22}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  const body = `
  <g transform="rotate(${tilt} ${x0 + tapeW / 2} ${cy})">
    <g filter="url(#ts${seed})"><path d="${tape}" fill="${color}"/></g>
    <path d="${tape}" fill="url(#weave${seed})"/>
    <path d="${tape}" fill="url(#sheen${seed})"/>
    ${text(no, { font: 'monoB', size: 17, tracking: 1, x: textX, y: baseline - 4, fill: ink, attrs: 'opacity=".8"' })}
    ${text(title, { font: 'hand', size: titleSize, x: textX + noW + gap, y: baseline + 2, fill: ink })}
  </g>
  <line class="cue" x1="${r(lineX0)}" y1="${cy + 4}" x2="${r(lineX1)}" y2="${cy + 4}" stroke="#8A8A96" stroke-width="3" stroke-linecap="round"/>
  ${text(jp, { font: 'dot', size: 17, x: W - 12 - labW, y: cy + 10, fill: '#8A8A96' })}
  ${text('  ·  ' + en, { font: 'monoB', size: 14, tracking: 0.6, x: W - 12 - labW + measure(jp, { font: 'dot', size: 17 }), y: cy + 9, fill: '#8A8A96' })}
  `;
  return svgDoc({ w: W, h: H, title: `${no} ${title}: ${en}`, defs, css, body });
}
