// PA DESK (optional): the contribution calendar as a step sequencer.
// 7 rows = 7 days (a diatonic scale, B at the top down to C), 1 column = 1 week,
// a playhead stepping across at 120 BPM in 16ths, pads flashing as it passes.
import { text, measure } from '../lib/text.mjs';
import { svgDoc, r } from '../lib/svg.mjs';
import { C } from '../lib/palette.mjs';

const PAD = ['#25252C', '#5C1D3D', '#A1235E', '#F43092', '#FF8CC6'];
const NOTES = ['B', 'A', 'G', 'F', 'E', 'D', 'C']; // sun..sat, top to bottom
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function renderSequencer(cfg, cal, stats) {
  const W = 1000, H = 384;
  const weeks = cal?.weeks ?? Array.from({ length: 53 }, () => Array.from({ length: 7 }, (_, i) => ({ count: 0, level: 0, weekday: i, date: '' })));
  const cols = weeks.length;
  const x0 = 88, x1 = 976, gy0 = 126, rowP = 28.4;
  const colP = (x1 - x0) / cols;
  const padW = Math.max(4, colP - 3.4), padH = rowP - 6;
  const step = 0.125; // a 16th at 120 BPM
  const loop = (cols * step).toFixed(3);

  // pads
  let pads = '', flashes = '', css = '';
  weeks.forEach((w, c) => {
    for (const d of w) {
      const row = d.weekday;
      const x = x0 + c * colP, y = gy0 + row * rowP;
      pads += `<rect x="${r(x)}" y="${r(y)}" width="${r(padW)}" height="${r(padH)}" rx="3" fill="${PAD[d.level] ?? PAD[0]}"/>`;
      if (d.level > 0) flashes += `<rect class="hit c${c}" x="${r(x)}" y="${r(y)}" width="${r(padW)}" height="${r(padH)}" rx="3" fill="#fff"/>`;
    }
  });
  for (let c = 0; c < cols; c++) if (flashes.includes(` c${c}"`)) css += `.c${c}{animation-delay:${(c * step).toFixed(3)}s}`;

  // bar lines every 4 steps + month labels
  let bars = '', months = '';
  for (let c = 4; c < cols; c += 4) bars += `<rect x="${r(x0 + c * colP - 2.1)}" y="${gy0 - 4}" width="1" height="${r(rowP * 7)}" fill="#fff" opacity=".06"/>`;
  // month labels where a month starts, skipping any that would collide (like GitHub does)
  const starts = [];
  let lastM = -1;
  weeks.forEach((w, c) => {
    const first = w.find((d) => d.date)?.date;
    if (!first) return;
    const m = Number(first.slice(5, 7)) - 1;
    if (m !== lastM) { starts.push([c, m]); lastM = m; }
  });
  starts.forEach(([c, m], i) => {
    const next = starts[i + 1]?.[0] ?? cols;
    if (next - c < 3 || c > cols - 3) return;
    months += text(MONTHS[m], { font: 'monoB', size: 9.5, tracking: 1, x: x0 + c * colP, y: gy0 - 10, fill: '#7C7C88' });
  });

  // piano keys
  let keys = '';
  NOTES.forEach((n, i) => {
    const y = gy0 + i * rowP - 2;
    keys += `<rect x="26" y="${r(y)}" width="48" height="${r(rowP - 1.4)}" rx="3" fill="#ECE8E0"/>`;
    keys += text(n, { font: 'monoB', size: 10, x: 64, y: y + rowP / 2 + 3.5, anchor: 'middle', fill: '#6b6b75' });
  });
  // black keys sit between B-A, A-G, G-F, E-D, D-C (no black key between F and E)
  [0, 1, 2, 4, 5].forEach((i) => {
    const y = gy0 + (i + 1) * rowP - 2 - 8;
    keys += `<rect x="26" y="${r(y)}" width="28" height="14" rx="2" fill="#16161a"/>`;
  });

  // LCD readouts
  const s = stats;
  const lcd = [
    ['TOTAL', s ? s.total.toLocaleString('en-US') : '----'],
    ['STREAK', s ? `${s.current}d` : '--'],
    ['LONGEST', s ? `${s.longest}d` : '--'],
    ['PEAK DAY', s ? `${s.best.count}` : '--'],
  ];
  const lw = 140, lh = 54, lx0 = W - 24 - lcd.length * lw - (lcd.length - 1) * 12, ly = 24;
  let lcds = '';
  lcd.forEach(([label, val], i) => {
    const lx = lx0 + i * (lw + 12);
    lcds += `<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="8" fill="#08100b" stroke="#000" stroke-opacity=".6"/>
      <rect x="${lx + 4}" y="${ly + 4}" width="${lw - 8}" height="${lh - 8}" rx="5" fill="url(#lcd)"/>
      ${text(label, { font: 'monoB', size: 8.5, tracking: 1.8, x: lx + 12, y: ly + 18, fill: C.mint, attrs: 'opacity=".6"' })}
      ${text(val, { font: 'dot', size: 24, x: lx + lw - 12, y: ly + 45, anchor: 'end', fill: C.mint })}`;
  });

  const caption = cal ? `1 step = 1 week  ·  rows = sun → sat  ·  120 BPM in 16ths` : 'soundcheck: the first workflow run loads the pattern';
  const updated = `updated ${cfg.today.iso}`;

  const defs = `
    <linearGradient id="bodyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A1A20"/><stop offset="1" stop-color="#0F0F12"/></linearGradient>
    <linearGradient id="rim" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${C.pink}"/><stop offset=".55" stop-color="${C.blue}"/><stop offset="1" stop-color="${C.teal}"/></linearGradient>
    <linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2a20"/><stop offset="1" stop-color="#071710"/></linearGradient>
    <linearGradient id="ph" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="sh" x="-3%" y="-5%" width="106%" height="115%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".3"/></filter>
  `;
  const style = `
    .head{animation:head ${loop}s steps(${cols}) infinite}
    @keyframes head{from{transform:translateX(0)}to{transform:translateX(${r(cols * colP)}px)}}
    .hit{opacity:0;animation:hit ${loop}s linear infinite}
    @keyframes hit{0%{opacity:.85}5%{opacity:0}100%{opacity:0}}
    ${css}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  `;
  const body = `
    <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="22" fill="url(#bodyg)" filter="url(#sh)"/>
    <rect x="9" y="9" width="${W - 18}" height="${H - 18}" rx="21" fill="none" stroke="url(#rim)" stroke-width="2"/>
    ${text('SEQ-365', { font: 'dela', size: 30, x: 34, y: 58, fill: C.paper })}
    ${text('CONTRIBUTION SEQUENCER', { font: 'monoB', size: 9.5, tracking: 2.2, x: 36, y: 78, fill: '#7C7C88' })}
    ${text('@' + cfg.handle, { font: 'monoB', size: 9.5, tracking: 1.2, x: 36 + measure('CONTRIBUTION SEQUENCER', { font: 'monoB', size: 9.5, tracking: 2.2 }) + 14, y: 78, fill: C.pink })}
    ${lcds}
    ${months}
    ${keys}
    ${bars}
    ${pads}
    ${flashes}
    <g class="head"><rect x="${r(x0 - 1.7)}" y="${gy0 - 6}" width="${r(colP)}" height="${r(rowP * 7 + 4)}" fill="url(#ph)"/><path d="M${r(x0 + padW / 2 - 5)} ${gy0 - 18}h10l-5 7z" fill="${C.pink}"/></g>
    ${text(caption, { font: 'mono', size: 10.5, x: x0, y: H - 30, fill: '#7C7C88' })}
    ${text(updated, { font: 'mono', size: 10.5, x: x1, y: H - 30, anchor: 'end', fill: '#7C7C88' })}
  `;
  const title = s ? `Contribution sequencer: ${s.total} contributions in the last year, longest streak ${s.longest} days` : 'Contribution sequencer (soundcheck)';
  return svgDoc({ w: W, h: H, title, defs, css: style, body });
}
