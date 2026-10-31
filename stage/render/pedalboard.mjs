// GEAR: the stack as a pedalboard. Each skill is a stompbox, wired in a real
// signal-chain order (tuner -> fuzz -> gate -> drive -> mod -> delay -> verb),
// with a pulse of signal running through the patch cables.
import { text, measure, fit } from '../lib/text.mjs';
import { svgDoc, rng, r } from '../lib/svg.mjs';
import { ICONS } from '../lib/icons.mjs';
import { C } from '../lib/palette.mjs';

const PW = 212, PH = 150; // pedal size
const JACK_A = 34, JACK_B = PW - 34; // top jack x positions

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r1, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  return 0.2126 * r1 + 0.7152 * g + 0.0722 * b;
}

function knob(x, y, angle, label, labelFill, id) {
  const a = ((angle - 90) * Math.PI) / 180;
  const px = x + Math.cos(a) * 11, py = y + Math.sin(a) * 11;
  return `<g>
    <circle cx="${x}" cy="${y + 1.5}" r="17.5" fill="#000" opacity=".28"/>
    <circle cx="${x}" cy="${y}" r="17" fill="url(#skirt)"/>
    <circle cx="${x}" cy="${y}" r="12.5" fill="url(#cap)" stroke="#000" stroke-opacity=".5" stroke-width="1"/>
    <line ${id ? `class="${id}" ` : ''}x1="${x}" y1="${y}" x2="${r(px)}" y2="${r(py)}" stroke="${C.paper}" stroke-width="2.6" stroke-linecap="round"/>
    ${text(label, { font: 'monoB', size: 9.5, tracking: 1.2, x, y: y + 33, anchor: 'middle', fill: labelFill })}
  </g>`;
}

function footswitch(x, y) {
  return `<g>
    <circle cx="${x}" cy="${y + 2}" r="19" fill="#000" opacity=".3"/>
    <circle cx="${x}" cy="${y}" r="19" fill="url(#nut)"/>
    <circle cx="${x}" cy="${y}" r="13" fill="url(#chrome)" stroke="#6b6d76" stroke-width="1"/>
    <ellipse cx="${x - 3}" cy="${y - 4}" rx="6" ry="3.5" fill="#fff" opacity=".55"/>
  </g>`;
}

function icon(name, x, y, s, fill) {
  const d = ICONS[name];
  if (!d) return '';
  return `<path transform="translate(${r(x)} ${r(y)}) scale(${r(s / 24, 3)})" fill="${fill}" d="${d}"/>`;
}

function pedal(p, x, y, rot, i, flowRight) {
  const dark = lum(p.color) < 0.45;
  const fg = p.fg ?? (dark ? C.paper : C.ink);
  const sub = dark ? 'rgba(246,241,231,.72)' : 'rgba(14,14,16,.7)';
  let inner = `
    <rect x="0" y="4" width="${PW}" height="${PH}" rx="14" fill="#000" opacity=".35"/>
    <rect x="0" y="0" width="${PW}" height="${PH}" rx="14" fill="${p.color}"/>
    <rect x="0" y="0" width="${PW}" height="${PH}" rx="14" fill="url(#encl)"/>
    <rect x="1" y="1" width="${PW - 2}" height="${PH - 2}" rx="13" fill="none" stroke="#fff" stroke-opacity=".22"/>
    ${[[9, 9], [PW - 9, 9], [9, PH - 9], [PW - 9, PH - 9]].map(([sx, sy]) => `<circle cx="${sx}" cy="${sy}" r="2.4" fill="#000" opacity=".22"/>`).join('')}
  `;
  // controls row
  if (p.display) {
    // tuner: a little LCD with a cursor and a needle
    inner += `
      <rect x="18" y="16" width="${PW - 36}" height="54" rx="7" fill="#0b0f0c" stroke="#000" stroke-opacity=".6"/>
      <rect x="22" y="20" width="${PW - 44}" height="46" rx="5" fill="url(#lcd)"/>
      ${text(p.display, { font: 'dot', size: 22, x: 34, y: 52, fill: C.mint })}
      <rect class="cursor" x="${34 + measure(p.display, { font: 'dot', size: 22 }) + 4}" y="34" width="11" height="20" fill="${C.mint}"/>
      ${Array.from({ length: 9 }, (_, k) => `<rect x="${118 + k * 8}" y="${k === 4 ? 26 : 31}" width="2" height="${k === 4 ? 14 : 9}" fill="${C.mint}" opacity="${k === 4 ? 1 : 0.55}"/>`).join('')}
      <g class="needle"><rect x="150" y="38" width="2.4" height="24" rx="1" fill="${C.pink}"/></g>
      ${text('CENTS', { font: 'monoB', size: 8, tracking: 1.5, x: 151, y: 63, anchor: 'middle', fill: C.mint, attrs: 'opacity=".6"' })}
    `;
  } else {
    const n = p.knobs.length;
    const span = PW - 60;
    p.knobs.forEach((k, j) => {
      const kx = n === 1 ? PW / 2 : 30 + (span * j) / (n - 1);
      inner += knob(r(kx), 34, k.at, k.label, fg, j === 0 ? `kn kn${i}` : '');
    });
  }
  // name plate
  const nameSize = fit(p.name, PW - 110, { font: 'dela', size: 24 });
  inner += icon(p.icon, 16, 86, 22, fg);
  inner += text(p.name, { font: 'dela', size: nameSize, x: 46, y: 106, fill: fg });
  inner += text(p.fx, { font: 'monoB', size: 11, tracking: 2.2, x: 17, y: 124, fill: fg });
  inner += text(p.sub, { font: 'mono', size: fit(p.sub, PW - 78, { font: 'mono', size: 10 }), x: 17, y: 139, fill: sub });
  // led + footswitch
  inner += `<circle cx="${PW - 34}" cy="88" r="7" fill="#000" opacity=".35"/>
    <circle class="led led${i}" cx="${PW - 34}" cy="88" r="4.6" fill="${p.led ?? '#ff3355'}"/>
    <circle class="led led${i}" cx="${PW - 34}" cy="88" r="9" fill="${p.led ?? '#ff3355'}" opacity=".35" filter="url(#glow)"/>`;
  inner += footswitch(PW - 34, PH - 30);
  // jacks on the top edge
  const jin = flowRight ? JACK_A : JACK_B;
  const jout = flowRight ? JACK_B : JACK_A;
  inner += [jin, jout].map((jx) => `<rect x="${jx - 9}" y="-7" width="18" height="10" rx="2" fill="url(#jack)"/>`).join('');
  return { svg: `<g transform="translate(${x} ${y}) rotate(${rot} ${PW / 2} ${PH / 2})">${inner}</g>`, jin: [x + jin, y - 6], jout: [x + jout, y - 6] };
}

function cablePath(a, b, lift) {
  const midY = Math.min(a[1], b[1]) - lift;
  return `M${r(a[0])} ${r(a[1])}C${r(a[0])} ${r(midY)} ${r(b[0])} ${r(midY)} ${r(b[0])} ${r(b[1])}`;
}

export function renderPedalboard(cfg) {
  const W = 1000, H = 560;
  const rand = rng(21);
  const pedals = cfg.pedals;
  const gapX = (W - 60 - 4 * PW) / 3;
  const row1Y = 112, row2Y = 352;
  const xs = [0, 1, 2, 3].map((k) => 30 + k * (PW + gapX));
  const placed = [];
  pedals.forEach((p, i) => {
    const row = i < 4 ? 0 : 1;
    const col = row === 0 ? i : 3 - (i - 4); // snake: row 2 runs right -> left
    const rot = ((rand() - 0.5) * 2.4).toFixed(2);
    placed.push(pedal(p, xs[col], row === 0 ? row1Y : row2Y, rot, i, row === 0));
  });

  // cables
  const cables = [];
  const inStart = [6, 64];
  cables.push(`M${inStart[0]} ${inStart[1]}C${xs[0] - 10} ${inStart[1]} ${placed[0].jin[0]} ${inStart[1] - 10} ${placed[0].jin[0]} ${placed[0].jin[1]}`);
  for (let i = 0; i < placed.length - 1; i++) {
    const a = placed[i].jout, b = placed[i + 1].jin;
    if (i === 3) {
      // drop from the back row to the front row along the right edge
      cables.push(`M${r(a[0])} ${r(a[1])}C${r(a[0])} ${r(a[1] - 58)} ${W - 6} ${r(a[1] - 40)} ${W - 8} ${r((a[1] + b[1]) / 2)}S${r(b[0])} ${r(b[1] - 70)} ${r(b[0])} ${r(b[1])}`);
    } else cables.push(cablePath(a, b, 46 + rand() * 12));
  }
  const last = placed[placed.length - 1].jout;
  const outEnd = [6, row2Y - 50];
  cables.push(`M${r(last[0])} ${r(last[1])}C${r(last[0])} ${r(last[1] - 44)} ${xs[0] - 6} ${outEnd[1]} ${outEnd[0]} ${outEnd[1]}`);

  const cableSvg = cables.map((d, i) => `
    <path d="${d}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="9" stroke-linecap="round" transform="translate(0 3)"/>
    <path d="${d}" fill="none" stroke="#1d1d24" stroke-width="7.5" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#5a5a66" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".7" transform="translate(-1 -1.5)"/>
    <path class="sig sig${i}" pathLength="100" d="${d}" fill="none" stroke="${C.pink}" stroke-width="5" stroke-linecap="round" stroke-dasharray="7 120" stroke-dashoffset="107" filter="url(#glow)"/>
  `).join('');

  // plugs at every jack
  const plugs = placed.flatMap((p) => [p.jin, p.jout]).map(([x, y]) => `<rect x="${r(x - 6)}" y="${r(y - 16)}" width="12" height="18" rx="3" fill="url(#plug)"/>`).join('');

  // board
  const bx = 14, by = 80, bw = W - 28, bh = H - by - 14;
  let slats = '';
  for (let y = by + 18; y < by + bh - 20; y += 34) slats += `<rect x="${bx + 16}" y="${y}" width="${bw - 32}" height="24" rx="4" fill="url(#slat)"/>`;

  const n = cables.length;
  const step = 0.32, cycle = n * step + 1.4;
  const sigCss = Array.from({ length: n }, (_, i) => `.sig${i}{animation:sig ${cycle.toFixed(2)}s ${(i * step).toFixed(2)}s linear infinite}`).join('');
  const sigPct = ((step * 2.2) / cycle) * 100;
  const ledCss = pedals.map((_, i) => `.led${i}{animation:led ${(2.2 + (i % 3) * 0.4).toFixed(1)}s ${(-i * 0.5).toFixed(1)}s ease-in-out infinite}`).join('');

  const css = `
    @keyframes sig{0%{stroke-dashoffset:107;opacity:1}${sigPct.toFixed(1)}%{stroke-dashoffset:0;opacity:1}${(sigPct + 0.1).toFixed(1)}%,100%{stroke-dashoffset:0;opacity:0}}
    ${sigCss}
    @keyframes led{0%,100%{opacity:1}50%{opacity:.55}}
    ${ledCss}
    .cursor{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
    .needle{transform-box:fill-box;transform-origin:50% 100%;animation:needle 2.6s ease-in-out infinite}
    @keyframes needle{0%,100%{transform:rotate(-14deg)}35%{transform:rotate(6deg)}60%{transform:rotate(-3deg)}80%{transform:rotate(1deg)}}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  `;
  const defs = `
    <linearGradient id="encl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
    <radialGradient id="cap" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#4a4a54"/><stop offset=".6" stop-color="#1b1b20"/><stop offset="1" stop-color="#0b0b0e"/></radialGradient>
    <radialGradient id="skirt" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#2a2a31"/><stop offset="1" stop-color="#101014"/></radialGradient>
    <radialGradient id="chrome" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c9cbd3"/><stop offset="1" stop-color="#6e7079"/></radialGradient>
    <radialGradient id="nut" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#b9bcc6"/><stop offset="1" stop-color="#4c4e56"/></radialGradient>
    <linearGradient id="jack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dbe2"/><stop offset="1" stop-color="#6f717a"/></linearGradient>
    <linearGradient id="plug" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2b2b33"/><stop offset=".45" stop-color="#55555f"/><stop offset="1" stop-color="#1a1a20"/></linearGradient>
    <linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2a20"/><stop offset="1" stop-color="#071710"/></linearGradient>
    <linearGradient id="slat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c2c34"/><stop offset="1" stop-color="#1e1e25"/></linearGradient>
    <linearGradient id="boardg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#202027"/><stop offset="1" stop-color="#121216"/></linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <filter id="bsh" x="-3%" y="-3%" width="106%" height="110%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".35"/></filter>
  `;

  const label = (str, x, y, anchor) => text(str, { font: 'monoB', size: 12, tracking: 1.6, x, y, anchor, fill: '#8A8A96' });
  const body = `
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="18" fill="url(#boardg)" filter="url(#bsh)"/>
    <rect x="${bx + 1}" y="${by + 1}" width="${bw - 2}" height="${bh - 2}" rx="17" fill="none" stroke="#3a3a44" stroke-width="2"/>
    ${slats}
    ${placed.map((p) => p.svg).join('')}
    ${cableSvg}
    ${plugs}
    ${label('GUITAR →', 10, 40, 'start')}
    ${label('→ AMP', 10, row2Y - 74, 'start')}
    ${label('TRUE BYPASS (MOSTLY)', W - 10, 40, 'end')}
  `;
  return svgDoc({ w: W, h: H, title: 'Gear: ' + pedals.map((p) => `${p.name} (${p.fx.toLowerCase()})`).join(', '), defs, css, body });
}
