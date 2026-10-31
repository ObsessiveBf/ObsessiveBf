// ENCORE buttons (stage-door passes) and the end-of-show footer strip.
import { text, measure } from '../lib/text.mjs';
import { svgDoc, r } from '../lib/svg.mjs';
import { ICONS } from '../lib/icons.mjs';
import { C } from '../lib/palette.mjs';

export function renderButton({ icon, label, value, accent }) {
  const valSize = 17, labSize = 10;
  const vW = measure(value, { font: 'monoB', size: valSize, tracking: 0.2 });
  const lW = measure(label, { font: 'monoB', size: labSize, tracking: 2 });
  const W = Math.ceil(Math.max(vW, lW) + 92), H = 64;
  const X = 2, Y = 2, BW = W - 10, BH = H - 10;
  const css = `.btn{animation:pop 3.2s ease-in-out infinite}@keyframes pop{0%,100%{transform:translate(0,0)}50%{transform:translate(-1px,-1px)}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
  const body = `
    <rect x="${X + 6}" y="${Y + 6}" width="${BW}" height="${BH}" rx="${BH / 2}" fill="${accent}"/>
    <g class="btn">
      <rect x="${X}" y="${Y}" width="${BW}" height="${BH}" rx="${BH / 2}" fill="${C.ink}" stroke="${accent}" stroke-width="2"/>
      <circle cx="${X + BH / 2}" cy="${Y + BH / 2}" r="${BH / 2 - 7}" fill="${accent}"/>
      <path transform="translate(${r(X + BH / 2 - 11)} ${r(Y + BH / 2 - 11)}) scale(${r(22 / 24, 3)})" fill="${C.ink}" d="${ICONS[icon]}"/>
      ${text(label, { font: 'monoB', size: labSize, tracking: 2, x: X + BH + 8, y: Y + 22, fill: '#9A9AA6' })}
      ${text(value, { font: 'monoB', size: valSize, tracking: 0.2, x: X + BH + 8, y: Y + 41, fill: C.paper })}
    </g>`;
  return svgDoc({ w: W, h: H, title: `${label}: ${value}`, css, body });
}

export function renderFooter(cfg) {
  const W = 1000, H = 70;
  const mid = W / 2;
  const s1 = cfg.footer.jp, s2 = cfg.footer.en, s3 = cfg.footer.bye;
  const w1 = measure(s1, { font: 'dot', size: 18 });
  const w2 = measure(s2, { font: 'monoB', size: 13, tracking: 2 });
  const w3 = measure(s3, { font: 'dot', size: 18 });
  const gap = 18;
  const total = w1 + gap + w2 + gap + w3;
  const x0 = mid - total / 2;
  const css = `.cue{stroke-dasharray:2 9;animation:cue 1.6s linear infinite}@keyframes cue{to{stroke-dashoffset:-22}}.cue2{stroke-dasharray:2 9;animation:cue2 1.6s linear infinite}@keyframes cue2{to{stroke-dashoffset:22}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
  const body = `
    <line class="cue2" x1="20" y1="${H / 2}" x2="${r(x0 - 26)}" y2="${H / 2}" stroke="#8A8A96" stroke-width="3" stroke-linecap="round"/>
    <line class="cue" x1="${r(x0 + total + 26)}" y1="${H / 2}" x2="${W - 20}" y2="${H / 2}" stroke="#8A8A96" stroke-width="3" stroke-linecap="round"/>
    ${text(s1, { font: 'dot', size: 18, x: x0, y: H / 2 + 6.5, fill: '#8A8A96' })}
    ${text(s2, { font: 'monoB', size: 13, tracking: 2, x: x0 + w1 + gap, y: H / 2 + 5, fill: '#8A8A96' })}
    ${text(s3, { font: 'dot', size: 18, x: x0 + w1 + gap + w2 + gap, y: H / 2 + 6.5, fill: '#8A8A96' })}
  `;
  return svgDoc({ w: W, h: H, title: `${s1} ${s2} ${s3}`, css, body });
}
