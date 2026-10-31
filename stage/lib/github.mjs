// Contribution calendar for the PA desk. Uses the GraphQL API when a token is
// available (the workflow passes GITHUB_TOKEN), otherwise reads the public
// calendar fragment. Returns null instead of throwing, so a hiccup never wipes
// the last good render.

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel weekday } }
      }
    }
  }
}`;

const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

async function viaGraphQL(login, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'obsessivebf-stage' },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`graphql ${res.status}`);
  const json = await res.json();
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error('graphql: no calendar in response');
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0, weekday: d.weekday }))),
  };
}

async function viaHTML(login) {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(login)}/contributions`, { headers: { 'User-Agent': 'obsessivebf-stage' } });
  if (!res.ok) throw new Error(`contributions page ${res.status}`);
  const html = await res.text();
  const counts = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = /^(\d[\d,]*) contribution/.exec(m[2].trim());
    counts.set(m[1], n ? Number(n[1].replace(/,/g, '')) : 0);
  }
  const days = [];
  for (const m of html.matchAll(/<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g)) {
    const tag = m[0];
    const id = /id="([^"]+)"/.exec(tag)?.[1];
    const level = Number(/data-level="(\d)"/.exec(tag)?.[1] ?? 0);
    days.push({ date: m[1], level, count: counts.get(id) ?? (level ? 1 : 0) });
  }
  if (!days.length) throw new Error('contributions page: no days parsed');
  days.sort((a, b) => a.date.localeCompare(b.date));
  const weeks = [];
  for (const d of days) {
    const weekday = new Date(d.date + 'T00:00:00Z').getUTCDay();
    if (!weeks.length || weekday === 0) weeks.push([]);
    weeks[weeks.length - 1].push({ ...d, weekday });
  }
  const total = Number(/([\d,]+)\s+contributions?\s+in the last year/.exec(html)?.[1]?.replace(/,/g, '')) || days.reduce((s, d) => s + d.count, 0);
  return { total, weeks };
}

export async function fetchCalendar(login) {
  const token = process.env.GITHUB_TOKEN;
  try {
    if (token) return await viaGraphQL(login, token);
  } catch (e) {
    console.warn('graphql failed, falling back to the public page:', e.message);
  }
  try {
    return await viaHTML(login);
  } catch (e) {
    console.warn('could not read the contribution calendar:', e.message);
    return null;
  }
}

export function calendarStats(cal) {
  const days = cal.weeks.flat();
  const today = days[days.length - 1]?.date;
  let longest = 0, run = 0, best = { count: 0, date: '' }, active = 0;
  for (const d of days) {
    if (d.count > 0) { run++; active++; longest = Math.max(longest, run); } else run = 0;
    if (d.count > best.count) best = d;
  }
  // current streak: allow today to be empty (the day isn't over yet)
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i === days.length - 1 && days[i].date === today) continue;
    else break;
  }
  return { total: cal.total, longest, current, best, active, days: days.length };
}
