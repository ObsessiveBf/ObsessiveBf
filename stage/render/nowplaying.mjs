// NOW PLAYING: a player bar that sits on top of the actual video.
// Spinning record, progress bar that takes exactly as long as the clip.
import { text, measure, fit } from '../lib/text.mjs';
import { svgDoc, rng, r } from '../lib/svg.mjs';
import { C } from '../lib/palette.mjs';

export function renderNowPlaying(cfg) {
  const np = cfg.nowPlaying;
  const W = 1000, H = 176;
  const rand = rng(5);
  const X = 8, Y = 10, BW = W - 16, BH = H - 20, RAD = 24;

  // record
  const cx = 96, cy = Y + BH / 2, R = 60;
  let grooves = '';
  for (let k = 0; k < 9; k++) grooves += `<circle cx="${cx}" cy="${cy}" r="${r(R - 6 - k * 3.6)}" fill="none" stroke="#2c2c34" stroke-width="${k % 3 ? 0.8 : 1.4}"/>`;
  const record = `
    <circle cx="${cx}" cy="${cy + 3}" r="${R}" fill="#000" opacity=".5"/>
    <g class="spin">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="#0b0b0e"/>
      ${grooves}
      <circle cx="${cx}" cy="${cy}" r="22" fill="${C.pink}"/>
      <circle cx="${cx}" cy="${cy}" r="22" fill="url(#lab)"/>
      ${text(cfg.name, { font: 'dela', size: 11, x: cx, y: cy - 6, anchor: 'middle', fill: C.ink })}
      ${text('SIDE A', { font: 'monoB', size: 6.5, tracking: 1, x: cx, y: cy + 14, anchor: 'middle', fill: C.ink })}
      <rect x="${cx + 10}" y="${cy - 2}" width="7" height="3" rx="1" fill="${C.ink}" opacity=".6"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="2.6" fill="#d9d9de"/>
    <path d="M${cx} ${cy}m-${R} 0a${R} ${R} 0 0 1 ${R * 0.6} -${R * 0.8}" fill="none" stroke="#fff" stroke-opacity=".10" stroke-width="16" stroke-linecap="round"/>
    <g>
      <circle cx="${cx + 62}" cy="${cy - 52}" r="9" fill="#2a2a31" stroke="#55555f"/>
      <path d="M${cx + 62} ${cy - 52}L${cx + 48} ${cy + 6}L${cx + 38} ${cy + 16}" fill="none" stroke="#c9cbd3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="${cx + 28}" y="${cy + 10}" width="14" height="10" rx="2" transform="rotate(-38 ${cx + 35} ${cy + 15})" fill="#c9cbd3"/>
    </g>`;

  // text block
  const tx = 186;
  const titleMax = 600;
  const tSize = fit(np.title, titleMax, { font: 'dela', size: 32 });
  let eq = '';
  const npW = measure('NOW PLAYING', { font: 'monoB', size: 12.5, tracking: 3 });
  for (let i = 0; i < 4; i++) eq += `<rect class="eq eq${i}" x="${tx + npW + 16 + i * 6}" y="${Y + 30}" width="4" height="14" rx="1" fill="${C.pink}"/>`;
  const jpX = tx + npW + 16 + 4 * 6 + 12;
  const info = `
    ${text('NOW PLAYING', { font: 'monoB', size: 12.5, tracking: 3, x: tx, y: Y + 44, fill: C.pink })}
    ${eq}
    ${text('再生中', { font: 'dot', size: 13, x: jpX, y: Y + 44, fill: '#8A8A96' })}
    ${text(np.title, { font: 'dela', size: tSize, x: tx, y: Y + 86, fill: C.paper })}
    ${text(np.sub, { font: 'mono', size: 14, x: tx, y: Y + 110, fill: '#A6A6B2' })}
  `;

  // progress
  const px0 = tx, px1 = 812, py = Y + 132;
  const progress = `
    <rect x="${px0}" y="${py - 3}" width="${px1 - px0}" height="6" rx="3" fill="#2a2a33"/>
    <g clip-path="url(#trk)"><rect class="fill" x="${px0}" y="${py - 3}" width="${px1 - px0}" height="6" rx="3" fill="url(#pg)"/></g>
    <g class="head"><circle cx="${px0}" cy="${py}" r="7" fill="${C.paper}"/><circle cx="${px0}" cy="${py}" r="11" fill="${C.pink}" opacity=".25"/></g>
    ${text(np.length, { font: 'monoB', size: 12, x: px1 + 14, y: py + 4.5, fill: '#A6A6B2' })}
  `;

  // controls
  const bx = 900, by = Y + 66;
  const controls = `
    <g fill="${C.paper}">
      <path d="M${bx - 52} ${by - 9}h3.5v18h-3.5zM${bx - 47} ${by}l13-9v18z"/>
      <circle cx="${bx}" cy="${by}" r="24" fill="${C.pink}"/>
      <rect x="${bx - 7.5}" y="${by - 9}" width="5" height="18" rx="1.5" fill="${C.ink}"/>
      <rect x="${bx + 2.5}" y="${by - 9}" width="5" height="18" rx="1.5" fill="${C.ink}"/>
      <path d="M${bx + 52} ${by - 9}h-3.5v18h3.5zM${bx + 47} ${by}l-13-9v18z"/>
    </g>
    ${text('WATCH BELOW ↓', { font: 'monoB', size: 10.5, tracking: 1.8, x: X + BW - 26, y: Y + 136.5, anchor: 'end', fill: '#8A8A96' })}
  `;

  const dur = Number(np.seconds) || 90;
  const eqCss = [0, 1, 2, 3].map((i) => `.eq${i}{animation:eq ${(0.55 + rand() * 0.5).toFixed(2)}s ${(-rand()).toFixed(2)}s ease-in-out infinite alternate}`).join('');
  const css = `
    .spin{transform-box:view-box;transform-origin:${cx}px ${cy}px;animation:spin 2.2s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .fill{transform-box:fill-box;transform-origin:0 50%;animation:fill ${dur}s linear infinite}
    @keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
    .head{animation:head ${dur}s linear infinite}
    @keyframes head{from{transform:translateX(0)}to{transform:translateX(${px1 - px0}px)}}
    .eq{transform-box:fill-box;transform-origin:50% 100%}
    @keyframes eq{0%{transform:scaleY(.2)}100%{transform:scaleY(1)}}
    ${eqCss}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  `;
  const defs = `
    <linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.blue}"/></linearGradient>
    <linearGradient id="rim" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${C.pink}"/><stop offset=".55" stop-color="${C.blue}"/><stop offset="1" stop-color="${C.teal}"/></linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1b21"/><stop offset="1" stop-color="#101013"/></linearGradient>
    <radialGradient id="lab" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <clipPath id="trk"><rect x="${px0}" y="${py - 3}" width="${px1 - px0}" height="6" rx="3"/></clipPath>
    <filter id="sh" x="-3%" y="-10%" width="106%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".3"/></filter>
  `;
  const body = `
    <rect x="${X}" y="${Y}" width="${BW}" height="${BH}" rx="${RAD}" fill="url(#bg)" filter="url(#sh)"/>
    <rect x="${X + 1}" y="${Y + 1}" width="${BW - 2}" height="${BH - 2}" rx="${RAD - 1}" fill="none" stroke="url(#rim)" stroke-width="2"/>
    ${record}${info}${progress}${controls}
  `;
  return svgDoc({ w: W, h: H, title: `Now playing: ${np.title}`, defs, css, body });
}
