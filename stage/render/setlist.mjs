// SETLIST: projects as a handwritten setlist gaff-taped to the stage floor.
// Marker titles, pen notes, stamped tags, and one very important MC break.
import { text, measure } from '../lib/text.mjs';
import { svgDoc, rng, r } from '../lib/svg.mjs';
import { underline, scribble, star, circleish, smooth, line } from '../lib/rough.mjs';
import { C } from '../lib/palette.mjs';

const INK = '#16161A';
const RED = '#D21E4F';
const PEN = '#2E37B5';

function teacup(x, y, s, rand) {
  // cup body, handle, saucer, steam: all stroke, round caps
  const cup = smooth([[x, y], [x + 2 * s, y + 26 * s], [x + 30 * s, y + 26 * s], [x + 32 * s, y]], false);
  const rim = line([x - 2 * s, y], [x + 34 * s, y], rand, { amt: 0.6, steps: 3 });
  const handle = smooth([[x + 31 * s, y + 6 * s], [x + 42 * s, y + 7 * s], [x + 41 * s, y + 17 * s], [x + 29 * s, y + 19 * s]]);
  const saucer = smooth([[x - 8 * s, y + 29 * s], [x + 16 * s, y + 33 * s], [x + 40 * s, y + 29 * s]]);
  const steam = [0, 1, 2].map((i) => smooth([[x + (9 + i * 7) * s, y - 4 * s], [x + (6 + i * 7) * s, y - 11 * s], [x + (10 + i * 7) * s, y - 17 * s], [x + (7 + i * 7) * s, y - 24 * s]])).join('');
  return `<g fill="none" stroke="${INK}" stroke-width="${2.6 * s}" stroke-linecap="round" stroke-linejoin="round"><path d="${rim}${cup}${handle}${saucer}"/><path class="steam" d="${steam}" stroke-width="${2 * s}" opacity=".7"/></g>`;
}

export function renderSetlist(cfg) {
  const rand = rng(11);
  const W = 1000;
  const px = 46, pw = 908, py = 40;
  const L = px + 52; // left text edge
  const titleX = L + 74;
  const tagRight = px + pw - 48;
  const rows = [];
  let y = py + 176;
  // hidden entries stay in config.json for later but don't show up;
  // songs are numbered M1, M2... automatically, the encore row is EN
  let m = 0;
  const items = cfg.setlist
    .filter((it) => !it.hidden)
    .map((it) => (it.mc ? it : { ...it, no: it.encore || it.no === 'EN' ? 'EN' : `M${++m}` }));

  for (const it of items) {
    if (it.mc) {
      y += 10;
      rows.push({ it, y, h: 64 });
      y += 64;
      continue;
    }
    const tW = measure(it.title, { font: 'hand', size: 40 });
    const nW = measure(it.note, { font: 'hand', size: 21 });
    const tagW = measure(it.tag, { font: 'monoB', size: 12.5, tracking: 1.6 }) + 24;
    const inline = titleX + tW + 22 + nW < tagRight - tagW - 26;
    const h = inline ? 62 : 90;
    rows.push({ it, y, h, tW, inline, tagW });
    y += h;
  }
  const ph = y - py + 34;
  const H = py + ph + 30;

  let body = '';
  for (const row of rows) {
    const { it } = row;
    const by = row.y;
    const wob = ((rand() - 0.5) * 1.2).toFixed(2);
    if (it.mc) {
      const noW = measure('MC', { font: 'hand', size: 30 });
      const pW = measure(it.crossed, { font: 'hand', size: 34 });
      const tx = titleX;
      body += `<g transform="rotate(${wob} ${titleX} ${by})">
        ${text('MC', { font: 'hand', size: 30, x: L, y: by, fill: RED })}
        ${text(it.crossed, { font: 'hand', size: 34, x: tx, y: by, fill: INK, attrs: 'opacity=".75"' })}
        <path d="${scribble(tx - 4, by - 12, pW + 8, 14, rand, 7)}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
        ${text(it.title, { font: 'hand', size: 34, x: tx + pW + 22, y: by, fill: INK })}
        ${teacup(tx + pW + 22 + measure(it.title, { font: 'hand', size: 34 }) + 26, by - 26, 0.95, rand)}
        ${text(it.note, { font: 'hand', size: 21, x: tx + pW + 22 + measure(it.title, { font: 'hand', size: 34 }) + 86, y: by - 2, fill: PEN })}
      </g>`;
      void noW;
      continue;
    }
    const tagX = tagRight - row.tagW;
    const tagRot = ((rand() - 0.5) * 6).toFixed(1);
    const noColor = it.no === 'EN' ? PEN : RED;
    body += `<g transform="rotate(${wob} ${titleX} ${by})">
      ${text(it.no, { font: 'hand', size: 30, x: L, y: by, fill: noColor })}
      ${text(it.title, { font: 'hand', size: 40, x: titleX, y: by + 2, fill: INK })}
      ${row.inline
        ? text(it.note, { font: 'hand', size: 21, x: titleX + row.tW + 22, y: by - 1, fill: PEN })
        : text(it.note, { font: 'hand', size: 21, x: titleX + 2, y: by + 30, fill: PEN })}
    </g>
    <g transform="rotate(${tagRot} ${tagX + row.tagW / 2} ${by - 10})">
      <rect x="${r(tagX)}" y="${by - 26}" width="${r(row.tagW)}" height="28" rx="6" fill="none" stroke="${it.tag === 'WIP' || it.tag === 'SOON' ? PEN : RED}" stroke-width="2.2"/>
      ${text(it.tag, { font: 'monoB', size: 12.5, tracking: 1.6, x: tagX + row.tagW / 2, y: by - 7, anchor: 'middle', fill: it.tag === 'WIP' || it.tag === 'SOON' ? PEN : RED })}
    </g>`;
    if (it.no === 'EN') {
      const enW = measure('EN', { font: 'hand', size: 30 });
      body += `<path d="${circleish(L + enW / 2, by - 10, enW / 2 + 14, 22, rand)}" fill="none" stroke="${PEN}" stroke-width="2.4" stroke-linecap="round"/>`;
      body += `<path class="twinkle" d="${star(titleX + row.tW + measure(it.note, { font: 'hand', size: 21 }) + 52, by - 12, 11, rand)}" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linejoin="round"/>`;
    }
  }

  // header
  const hY = py + 104;
  const setW = measure('SETLIST', { font: 'hand', size: 70 });
  const header = `
    ${text('SETLIST', { font: 'hand', size: 70, x: L, y: hY, fill: INK })}
    <path d="${underline(L, hY + 16, setW, rand)}" fill="none" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>
    ${text(cfg.today.dots, { font: 'hand', size: 24, x: px + pw - 52, y: py + 72, anchor: 'end', fill: INK })}
    ${text(cfg.setlistMeta.venue, { font: 'hand', size: 24, x: px + pw - 52, y: py + 104, anchor: 'end', fill: INK })}
    ${text(cfg.setlistMeta.note, { font: 'hand', size: 19, x: px + pw - 52, y: py + 134, anchor: 'end', fill: PEN })}
  `;

  // two pieces of gaff tape
  const tape = (cx, cy, w, h, rot) => `<g transform="rotate(${rot} ${cx} ${cy})"><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="#1E1E24"/><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="url(#gaff)"/><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h / 2.6}" fill="#fff" opacity=".07"/></g>`;

  const defs = `
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="9"/>
      <feColorMatrix type="matrix" values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .22  0 0 0 .55 -.18"/>
    </filter>
    <filter id="psh" x="-4%" y="-4%" width="108%" height="110%"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000" flood-opacity=".3"/></filter>
    <pattern id="gaff" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(90)"><rect width="1" height="5" fill="#fff" opacity=".05"/></pattern>
    <linearGradient id="fold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".07"/><stop offset=".52" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  `;
  const css = `
    .twinkle{transform-box:fill-box;transform-origin:center;animation:tw 2.8s ease-in-out infinite}
    @keyframes tw{0%,100%{transform:rotate(0) scale(1)}50%{transform:rotate(18deg) scale(1.18)}}
    .steam{animation:st 2.2s ease-in-out infinite}
    @keyframes st{0%,100%{opacity:.15;transform:translateY(3px)}50%{opacity:.75;transform:translateY(-2px)}}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  `;
  const cx = px + pw / 2, cy = py + ph / 2;
  const svgBody = `
  <g transform="rotate(-0.7 ${cx} ${cy})">
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="3" fill="${C.paper}" filter="url(#psh)"/>
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="3" filter="url(#paper)" opacity=".5"/>
    <rect x="${px}" y="${py + ph * 0.47 - 10}" width="${pw}" height="20" fill="url(#fold)"/>
    ${header}
    ${body}
    ${tape(px + 34, py + 6, 120, 34, -32)}
    ${tape(px + pw - 34, py + 6, 120, 34, 30)}
    ${tape(px + pw / 2, py + ph - 2, 150, 32, -2)}
  </g>`;
  return svgDoc({ w: W, h: H, title: 'Setlist: ' + items.filter((i) => !i.mc).map((i) => i.title).join(', '), defs, css, body: svgBody });
}
