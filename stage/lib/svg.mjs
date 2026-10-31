export const r = (v, p = 1) => { const m = 10 ** p; return Math.round(v * m) / m; };
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// tiny deterministic PRNG so renders are stable between runs
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function svgDoc({ w, h, title, body, defs = '', css = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
${css ? `<style>${css.replace(/\s+/g, ' ').trim()}</style>` : ''}
${defs ? `<defs>${defs}</defs>` : ''}
${body}
</svg>
`;
}

// 4-point sparkle
export function sparkle(cx, cy, s, fill = '#fff', extra = '') {
  const k = s * 0.22;
  return `<path ${extra} fill="${fill}" d="M${r(cx)} ${r(cy - s)}C${r(cx + k * 0.35)} ${r(cy - k)} ${r(cx + k)} ${r(cy - k * 0.35)} ${r(cx + s)} ${r(cy)}C${r(cx + k)} ${r(cy + k * 0.35)} ${r(cx + k * 0.35)} ${r(cy + k)} ${r(cx)} ${r(cy + s)}C${r(cx - k * 0.35)} ${r(cy + k)} ${r(cx - k)} ${r(cy + k * 0.35)} ${r(cx - s)} ${r(cy)}C${r(cx - k)} ${r(cy - k * 0.35)} ${r(cx - k * 0.35)} ${r(cy - k)} ${r(cx)} ${r(cy - s)}Z"/>`;
}

// rounded rect path with optional semicircle notches cut into top & bottom at x = notchX
export function ticketPath(x, y, w, h, rad, notchX, notchR) {
  const L = x, T = y, R = x + w, B = y + h;
  return [
    `M${L + rad} ${T}`,
    `H${notchX - notchR}`,
    `A${notchR} ${notchR} 0 0 0 ${notchX + notchR} ${T}`,
    `H${R - rad}`,
    `A${rad} ${rad} 0 0 1 ${R} ${T + rad}`,
    `V${B - rad}`,
    `A${rad} ${rad} 0 0 1 ${R - rad} ${B}`,
    `H${notchX + notchR}`,
    `A${notchR} ${notchR} 0 0 0 ${notchX - notchR} ${B}`,
    `H${L + rad}`,
    `A${rad} ${rad} 0 0 1 ${L} ${B - rad}`,
    `V${T + rad}`,
    `A${rad} ${rad} 0 0 1 ${L + rad} ${T}`,
    'Z',
  ].join('');
}
