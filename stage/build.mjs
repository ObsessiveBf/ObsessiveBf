// Renders every graphic in assets/stage (and assets/live) from config.json.
//   node stage/build.mjs            -> everything
//   node stage/build.mjs ticket gear -> just those jobs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTicket } from './render/ticket.mjs';
import { renderTape } from './render/tape.mjs';
import { renderSetlist } from './render/setlist.mjs';
import { renderPedalboard } from './render/pedalboard.mjs';
import { renderNowPlaying } from './render/nowplaying.mjs';
import { renderMarquee } from './render/marquee.mjs';
import { renderButton, renderFooter } from './render/buttons.mjs';
import { renderSequencer } from './render/sequencer.mjs';
import { fetchCalendar, calendarStats } from './lib/github.mjs';
import { missingGlyphs, usedChars } from './lib/text.mjs';
import { C } from './lib/palette.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'config.json'), 'utf8'));
const only = process.argv.slice(2);

// "tonight's show" is always today (New York time), so the ticket + setlist stay current
const parts = Object.fromEntries(
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
    .formatToParts(new Date()).map((p) => [p.type, p.value]),
);
cfg.today = { dots: `${parts.year}.${parts.month}.${parts.day}`, dow: parts.weekday.toUpperCase(), iso: `${parts.year}-${parts.month}-${parts.day}` };

const tapeInk = (color) => (['blue', 'roseHot', 'rose', 'plum', 'ink'].includes(color) ? C.paper : C.ink);

const jobs = {
  ticket: () => [['assets/stage/ticket.svg', renderTicket(cfg)]],
  marquee: () => [['assets/stage/marquee.svg', renderMarquee(cfg)]],
  setlist: () => [['assets/stage/setlist.svg', renderSetlist(cfg)]],
  gear: () => [['assets/stage/pedalboard.svg', renderPedalboard(cfg)]],
  nowplaying: () => [['assets/stage/now-playing.svg', renderNowPlaying(cfg)]],
  buttons: () => cfg.contacts.map((b) => [`assets/stage/btn-${b.id}.svg`, renderButton(b)]),
  footer: () => [['assets/stage/footer.svg', renderFooter(cfg)]],
  // section headers, numbered in order (the PA desk slots in after GEAR when enabled)
  tapes: () => {
    const order = [...cfg.sections];
    if (cfg.paDesk?.enabled) order.splice(order.findIndex((s) => s.id === 'gear') + 1, 0, { id: 'pa', title: 'PA DESK', jp: 'PA卓', en: 'github, live', color: 'mint' });
    let n = 0;
    return order.map((s, i) => [
      `${s.id === 'pa' ? 'assets/live' : 'assets/stage'}/h-${s.id}.svg`,
      renderTape({ ...s, no: s.id === 'encore' ? 'EN' : String(++n).padStart(2, '0'), color: C[s.color] ?? s.color, ink: tapeInk(s.color), seed: i + 3, tilt: i % 2 ? 1.1 : -1.4 }),
    ]);
  },
  // optional: contribution graph as a step sequencer (turn on in config.json -> paDesk.enabled)
  pa: async () => {
    if (!cfg.paDesk?.enabled) return [];
    const out = 'assets/live/pa-desk.svg';
    const cal = await fetchCalendar(cfg.login);
    if (!cal && fs.existsSync(path.join(root, out))) {
      console.warn('no calendar data this run, keeping the last PA desk render');
      return [];
    }
    return [[out, renderSequencer(cfg, cal, cal ? calendarStats(cal) : null)]];
  },
};

for (const [name, job] of Object.entries(jobs)) {
  if (only.length && !only.includes(name)) continue;
  for (const [rel, svg] of await job()) {
    const out = path.join(root, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
    if (prev === svg) continue;
    fs.writeFileSync(out, svg);
    console.log(`rendered ${rel} (${(svg.length / 1024).toFixed(1)} KB)`);
  }
}

if (process.env.STAGE_USED_CHARS) fs.writeFileSync(process.env.STAGE_USED_CHARS, JSON.stringify(usedChars(), null, 1));

const miss = missingGlyphs();
if (miss.length) {
  console.warn(`\nmissing glyphs (not in the bundled fonts): ${miss.join(' ')}`);
  console.warn('see stage/fonts/README.md to add more characters.');
}
