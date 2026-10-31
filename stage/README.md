# stage

The build that draws the README. Every word in the graphics is converted to
vector outlines, so the SVGs look identical everywhere and need no web fonts.

## change something

Edit `config.json` and push. The `stage` workflow re-renders `assets/stage/*.svg`
and commits them. It also runs nightly so the ticket and setlist always carry
today's date.

| key | controls |
| --- | --- |
| `name`, `kana`, `handle`, `role`, `tagline`, `subline`, `site` | the ticket |
| `ticket.fields` | the four printed fields at the bottom of the ticket |
| `marquee` | the LED sign (`c` = amber, pink, mint, white, blue) |
| `nowPlaying` | the player bar above the video (`seconds` = progress bar length) |
| `setlist`, `setlistMeta` | the setlist (`{ "mc": true, ... }` is the tea break row) |
| `pedals` | the pedalboard, in signal-chain order (top row left to right, bottom row right to left) |
| `sections` | the tape headers |
| `contacts` | the encore buttons |
| `paDesk.enabled` | the optional contribution sequencer (see below) |

## run it locally

```sh
npm ci --prefix stage
node stage/build.mjs           # everything
node stage/build.mjs setlist   # one piece: ticket marquee setlist gear nowplaying buttons footer tapes pa
```

## the PA desk (off for now)

`render/sequencer.mjs` turns the contribution graph into a step sequencer:
7 rows are the 7 days (a scale from B down to C), each column is a week, and a
playhead steps across at 120 BPM in 16ths while hit pads flash. To switch it on:

1. Profile settings: tick "Include private contributions on my profile" if your
   work lives in private repos.
2. Set `paDesk.enabled` to `true` in `config.json` and push.
3. Uncomment the PA DESK block in `README.md`.
