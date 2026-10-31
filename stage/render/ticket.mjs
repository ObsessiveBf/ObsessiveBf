// HERO: a live-house ticket. Pink body, blue stub, riso misprint on the name,
// a QR to the portfolio, and a foil glint that sweeps across every few seconds.
import QRCode from 'qrcode';
import { text, measure, chars } from '../lib/text.mjs';
import { svgDoc, ticketPath, sparkle, rng, r } from '../lib/svg.mjs';
import { C } from '../lib/palette.mjs';

function qrPath(data, x, y, size) {
  const qr = QRCode.create(data, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const m = size / n;
  let d = '';
  for (let row = 0; row < n; row++) {
    let col = 0;
    while (col < n) {
      if (qr.modules.get(row, col)) {
        let run = 1;
        while (col + run < n && qr.modules.get(row, col + run)) run++;
        d += `M${r(x + col * m, 2)} ${r(y + row * m, 2)}h${r(run * m, 2)}v${r(m, 2)}h${r(-run * m, 2)}z`;
        col += run;
      } else col++;
    }
  }
  return d;
}

function halftone(x0, y0, w, h, step, maxR, fn, fill) {
  let out = '';
  for (let y = y0; y <= y0 + h; y += step) {
    const odd = Math.round((y - y0) / step) % 2;
    for (let x = x0 + (odd ? step / 2 : 0); x <= x0 + w; x += step) {
      const k = fn((x - x0) / w, (y - y0) / h);
      if (k <= 0.04) continue;
      out += `<circle cx="${r(x)}" cy="${r(y)}" r="${r(maxR * Math.min(1, k), 2)}"/>`;
    }
  }
  return `<g fill="${fill}">${out}</g>`;
}

export function renderTicket(cfg) {
  const t = cfg.ticket;
  const W = 1000, H = 430;
  const X = 12, Y = 18, TW = 976, TH = 392, RAD = 22;
  const NX = 744, NR = 18; // perforation
  const shape = ticketPath(X, Y, TW, TH, RAD, NX, NR);
  const L = 46; // main area left
  const MR = NX - 30; // main area right
  const rand = rng(7);

  // --- header row
  const hdrY = 66;
  const ev = text(t.event, { font: 'dela', size: 23, x: L, y: hdrY, fill: C.ink });
  const evW = measure(t.event, { font: 'dela', size: 23 });
  const evEn = text(t.eventEn, { font: 'monoB', size: 12.5, tracking: 2.6, x: L + evW + 14, y: hdrY - 2, fill: C.ink });

  // LIVE pill + eq bars (right aligned)
  const pillW = 74, pillH = 24, pillX = MR - pillW, pillY = hdrY - 19;
  const live = `<g>
    <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="12" fill="${C.ink}"/>
    <circle class="rec" cx="${pillX + 16}" cy="${pillY + 12}" r="5" fill="${C.pink}"/>
    ${text('LIVE', { font: 'monoB', size: 13, tracking: 2, x: pillX + 28, y: pillY + 17, fill: C.paper })}
  </g>`;
  let eq = '';
  const eqX = pillX - 64;
  for (let i = 0; i < 6; i++) {
    const hgt = 20;
    eq += `<rect class="eq eq${i}" x="${eqX + i * 9}" y="${hdrY - hgt + 1}" width="6" height="${hgt}" rx="1.5" fill="${C.ink}"/>`;
  }
  const vol = text(`${cfg.today.dots} ${cfg.today.dow}`, { font: 'monoB', size: 13, tracking: 1.5, x: eqX - 14, y: hdrY - 2, anchor: 'end', fill: C.ink });

  const rule = (y, w = 2) => `<rect x="${L}" y="${y}" width="${MR - L}" height="${w}" fill="${C.ink}"/>`;

  // --- the name, with a riso misregistration layer
  const nameSize = 182;
  const nameY = 252;
  const nameW = measure(cfg.name, { font: 'dela', size: nameSize, tracking: 4 });
  const nameBlue = text(cfg.name, { font: 'dela', size: nameSize, tracking: 4, x: L - 4 + 9, y: nameY + 7, fill: C.blue, attrs: 'class="misreg"' });
  const nameInk = text(cfg.name, { font: 'dela', size: nameSize, tracking: 4, x: L - 4, y: nameY, fill: C.ink });

  // handle + kana next to the name
  const sideX = L + nameW + 26;
  const kana = text(cfg.kana, { font: 'dela', size: 46, x: sideX, y: 150, fill: C.ink });
  const handle = text('@' + cfg.handle, { font: 'monoB', size: 17, tracking: 0.6, x: sideX + 2, y: 188, fill: C.ink });
  const role = text(cfg.role, { font: 'monoB', size: 13, tracking: 2.2, x: sideX + 2, y: 214, fill: C.ink, attrs: 'opacity=".78"' });

  // tagline
  const tag = text(cfg.tagline, { font: 'dela', size: 31, tracking: 0.5, x: L, y: 300, fill: C.ink });
  const sub = text(cfg.subline, { font: 'monoB', size: 15.5, tracking: 0.4, x: L, y: 326, fill: C.ink, attrs: 'opacity=".82"' });

  // --- info grid (printed fields)
  const gY = 344, gH = 50;
  const cols = t.fields;
  const colW = (MR - L) / cols.length;
  let grid = rule(gY - 2, 2);
  cols.forEach((f, i) => {
    const cx = L + i * colW;
    if (i > 0) grid += `<rect x="${r(cx)}" y="${gY + 6}" width="1.5" height="${gH - 10}" fill="${C.ink}" opacity=".55"/>`;
    const pad = i === 0 ? 0 : 14;
    grid += text(f.jp, { font: 'dot', size: 12, x: cx + pad, y: gY + 20, fill: C.ink });
    const jpW = measure(f.jp, { font: 'dot', size: 12 });
    grid += text(f.en, { font: 'monoB', size: 9.5, tracking: 1.4, x: cx + pad + jpW + 6, y: gY + 19, fill: C.ink, attrs: 'opacity=".7"' });
    grid += text(f.value, { font: 'dot', size: 19, x: cx + pad, y: gY + 44, fill: C.ink });
  });

  // --- halftone + sparkles (main area, top right)
  const ht = halftone(470, 84, 260, 150, 9, 3.6, (u, v) => {
    const dx = u - 0.95, dy = v - 0.05;
    return 1.05 - Math.hypot(dx * 1.1, dy * 1.6);
  }, C.blue);

  const ht2 = halftone(NX + 4, 300, 240, 110, 8, 3.2, (u, v) => 0.95 - Math.hypot((u - 1) * 1.7, (v - 1) * 2.1), C.pink);
  const sparks = [
    [MR - 26, 104, 13], [sideX - 6, 96, 9], [L + nameW - 20, 92, 7], [MR - 80, 250, 8], [L + 8, 98, 6],
  ].map(([x, y, s], i) => `<g class="spk spk${i}">${sparkle(x, y, s, C.paper)}</g>`).join('');

  // --- stub
  const SX = NX, SW = X + TW - NX;
  const scx = SX + SW / 2;
  const qrS = 136, qrX = scx - qrS / 2, qrY = 84;
  const stub = `
    ${text('ADMIT ONE', { font: 'monoB', size: 13, tracking: 3.2, x: scx, y: 64, anchor: 'middle', fill: C.paper })}
    <rect x="${qrX - 10}" y="${qrY - 10}" width="${qrS + 20}" height="${qrS + 20}" rx="12" fill="${C.paper}"/>
    <path fill="${C.ink}" d="${qrPath(cfg.site, qrX, qrY, qrS)}"/>
    ${text('SCAN', { font: 'monoB', size: 12, tracking: 3, x: scx, y: 258, anchor: 'middle', fill: C.paper, attrs: 'opacity=".85"' })}
    ${text(cfg.siteLabel, { font: 'monoB', size: 14.5, tracking: 0.6, x: scx, y: 278, anchor: 'middle', fill: C.paper })}
    <rect x="${SX + 30}" y="300" width="${SW - 60}" height="1.5" fill="${C.paper}" opacity=".5"/>
    ${text('入場整理番号', { font: 'dot', size: 12, x: scx, y: 324, anchor: 'middle', fill: C.paper, attrs: 'opacity=".85"' })}
    ${text('No.' + t.no, { font: 'dot', size: 36, tracking: 1, x: scx, y: 366, anchor: 'middle', fill: C.paper })}
    ${text('KEEP THIS HALF', { font: 'monoB', size: 9, tracking: 2.4, x: scx, y: 390, anchor: 'middle', fill: C.paper, attrs: 'opacity=".6"' })}
  `;

  // perforation dashes
  let perf = '';
  for (let y = Y + NR + 8; y < Y + TH - NR - 8; y += 12) perf += `<rect x="${NX - 1}" y="${y}" width="2" height="6" rx="1" fill="${C.paper}" opacity=".9"/>`;

  // grain
  const defs = `
    <clipPath id="tk"><path d="${shape}"/></clipPath>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.2 1.25"/>
      <feComponentTransfer><feFuncA type="discrete" tableValues="0 0 .55 1"/></feComponentTransfer>
    </filter>
    <filter id="sh" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".28"/></filter>
    <linearGradient id="glint" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".45" stop-color="#fff" stop-opacity=".0"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".55"/>
      <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  `;

  const eqCss = Array.from({ length: 6 }, (_, i) => {
    const d = (0.7 + rand() * 0.6).toFixed(2);
    const dl = (-rand() * 1.2).toFixed(2);
    return `.eq${i}{animation:eq ${d}s ${dl}s ease-in-out infinite alternate}`;
  }).join('');
  const spkCss = Array.from({ length: 5 }, (_, i) => `.spk${i}{animation:tw ${2.4 + i * 0.37}s ${-i * 0.9}s ease-in-out infinite}`).join('');

  const css = `
    .eq{transform-box:fill-box;transform-origin:50% 100%}
    @keyframes eq{0%{transform:scaleY(.18)}50%{transform:scaleY(.75)}100%{transform:scaleY(1)}}
    ${eqCss}
    .rec{animation:rec 1.1s steps(1) infinite}
    @keyframes rec{0%{opacity:1}50%{opacity:.15}}
    .spk{transform-box:fill-box;transform-origin:center}
    @keyframes tw{0%,100%{transform:scale(.35) rotate(0deg);opacity:.35}50%{transform:scale(1) rotate(45deg);opacity:1}}
    ${spkCss}
    .glint{animation:gl 6.5s 1s cubic-bezier(.4,0,.2,1) infinite}
    @keyframes gl{0%{transform:translateX(-1100px)}22%,100%{transform:translateX(1100px)}}
    .misreg{mix-blend-mode:multiply}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  `;

  const body = `
  <g filter="url(#sh)"><path d="${shape}" fill="${C.pink}"/></g>
  <g clip-path="url(#tk)">
    <rect x="${NX}" y="0" width="${W - NX}" height="${H}" fill="${C.blue}"/>
    ${ht}${ht2}
    <rect x="0" y="0" width="${W}" height="${H}" filter="url(#grain)" opacity=".13"/>
    <g>${ev}${evEn}${vol}${eq}${live}</g>
    ${rule(80, 2)}${rule(85, 1)}
    ${nameBlue}${nameInk}
    ${kana}${handle}${role}
    ${tag}${sub}
    ${grid}
    ${sparks}
    ${stub}
    ${perf}
    <g class="glint"><rect x="-200" y="-40" width="600" height="${H + 80}" fill="url(#glint)" transform="skewX(-24)"/></g>
  </g>`;

  return svgDoc({ w: W, h: H, title: `${cfg.name}: ${cfg.tagline}`, defs, css, body });
}
