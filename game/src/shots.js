// Screenshot scenes: ?scene=title|play|alarm|win stages a fixed, deterministic
// moment of the game so its screenshots are real renders of this code.
// The game still runs from these states; nothing here is faked or composited.

import { TILE } from './config.js';

export function applyScene(game, scene) {
  const q = new URLSearchParams(window.location.search);
  const name = scene || q.get('scene') || '';
  if (!name) return false;
  const level = parseInt(q.get('level') || '1', 10);
  if (name === 'title') {
    game.mode = 'title';
    game.loadLevel(0);
    return true;
  }
  if (name === 'play') {
    game.loadLevel(Math.min(2, Math.max(0, level - 1)));
    game.mode = 'play';
    // Mid-gallery: the thief crouched behind a crate, a guard's cone
    // sweeping just past, one shard already pocketed.
    const p = game.player;
    p.x = 7.5 * TILE;
    p.y = 5.5 * TILE;
    p.sneaking = true;
    p.facing = 0.3;
    const g = game.guards[0];
    g.x = 15.5 * TILE;
    g.y = 5.5 * TILE;
    g.facing = Math.PI;
    g.state = 'patrol';
    g.meter = 12;
    if (game.world.shards[0]) game.world.shards[0].taken = true;
    game.maxMeter = 12;
    game.bannerLeft = 0;
    game.frozen = true;
    return true;
  }
  if (name === 'alarm') {
    game.loadLevel(1);
    game.mode = 'play';
    // The alarm is up: two guards closing in, the meter full, the thief
    // sprinting for the shadowed side of the hall.
    const p = game.player;
    p.x = 12.5 * TILE;
    p.y = 8.5 * TILE;
    p.running = true;
    p.facing = -Math.PI / 2;
    const g0 = game.guards[0];
    g0.x = 15.5 * TILE;
    g0.y = 6.5 * TILE;
    g0.facing = Math.PI * 0.75;
    g0.state = 'alert';
    g0.meter = 100;
    g0.lastSeen = { x: p.x, y: p.y };
    const g1 = game.guards[1];
    g1.x = 10.5 * TILE;
    g1.y = 10.5 * TILE;
    g1.facing = -Math.PI / 2;
    g1.state = 'alert';
    g1.meter = 100;
    g1.lastSeen = { x: p.x, y: p.y };
    game.alarms = 1;
    game.maxMeter = 100;
    game.bannerLeft = 0;
    game.frozen = true;
    return true;
  }
  if (name === 'win') {
    game.loadLevel(2);
    game.mode = 'win';
    game.elapsed = 214000;
    game.alarms = 1;
    game.attempts = 4;
    game.score = 8740;
    for (const s of game.world.shards) s.taken = true;
    if (game.world.opal) game.world.opal.taken = true;
    game.lootDone = true;
    game.frozen = true;
    return true;
  }
  return false;
}
