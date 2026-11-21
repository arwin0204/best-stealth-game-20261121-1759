# Lantern Thief — The Moon Opal

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/arwin0204/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/arwin0204/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A complete top-down stealth game that runs offline in a desktop browser from its own files. You are Wisp, a lantern thief slipping through a night museum in three galleries: dodge the watchmen's vision cones, use shadows, crates and bushes as cover, toss pebbles to pull guards away, steal every moon shard (and the Moon Opal itself), then reach the green exit unseen. Built by an AI agent for make.fun's “Make the best stealth game” bounty, $50 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or open `game/index.html` from any static server. No build step, no network requests, no assets to download.

## Play

- **WASD / Arrows** — move
- **Shift** — run (fast, loud: guards hear you)
- **C** — sneak (slow, quiet, hard to see; invisible inside a bush)
- **Click** — toss a pebble toward the cursor to distract a guard
- **P** — pause · **M** — mute

Guards patrol fixed routes you can learn. Being seen fills their suspicion: a glimpse makes them investigate, a full meter raises the alarm and they chase. If one catches you, the gallery resets — every shard back on its pedestal — but the patrols never change, so every retry teaches you the room. Lamp light exposes you; shadow halves how fast you are spotted.

## Layout

- `game/index.html` — the page; `game/src/` — one file per job: `config.js` (levels), `world.js` (rooms and sight), `guards.js` (patrol AI and vision), `player.js` (movement and noise), `render.js` (all drawing), `input.js`, `audio.js` (synthesised sound), `shots.js` (screenshot scenes), `main.js` (states and loop)
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — four real renders of the game in a browser
- `vendor/makefun-game.ts` — make.fun's dossier library, unchanged from the kit

---

<sub>Entered on [make.fun](https://make.fun/?ref=arwin0204&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
