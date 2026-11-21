// The level world: parses a level's map text into a tile grid and answers
// movement, sight and light questions. One clear job: know the room.

import { COLS, ROWS, TILE } from './config.js';

export const T = {
  WALL: '#',
  FLOOR: '.',
  SHADOW: ',',
  LAMP: 'L',
  CRATE: 'C',
  STATUE: 'S',
  BUSH: 'B',
  PLAYER: 'P',
  SHARD: '*',
  OPAL: 'O',
  EXIT: 'E',
  GUARD: 'G',
};

// Tiles a body cannot walk through.
export function blocksMovement(ch) {
  return ch === T.WALL || ch === T.CRATE || ch === T.STATUE;
}

// Tiles that stop a guard's line of sight (bushes do not: you hide inside them).
export function blocksSight(ch) {
  return ch === T.WALL || ch === T.CRATE || ch === T.STATUE;
}

export class World {
  constructor(level) {
    this.level = level;
    this.cols = COLS;
    this.rows = ROWS;
    this.grid = level.map.map((row) => row.split(''));
    this.shards = [];
    this.opal = null;
    this.exit = null;
    this.playerStart = { x: TILE * 1.5, y: TILE * 1.5 };
    this.lamps = [];
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const ch = this.grid[ty][tx];
        const cx = tx * TILE + TILE / 2;
        const cy = ty * TILE + TILE / 2;
        if (ch === T.PLAYER) this.playerStart = { x: cx, y: cy };
        else if (ch === T.SHARD) this.shards.push({ tx, ty, x: cx, y: cy, taken: false });
        else if (ch === T.OPAL) this.opal = { tx, ty, x: cx, y: cy, taken: false };
        else if (ch === T.EXIT) this.exit = { tx, ty, x: cx, y: cy };
        else if (ch === T.LAMP) this.lamps.push({ tx, ty, x: cx, y: cy });
      }
    }
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return T.WALL;
    return this.grid[ty][tx];
  }

  tileAtPx(x, y) {
    return this.tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  isBlockedPx(x, y) {
    return blocksMovement(this.tileAtPx(x, y));
  }

  // Circle-vs-tile collision: try the move, sliding along each axis, so the
  // thief glides along walls instead of sticking to their corners.
  moveCircle(pos, dx, dy, radius) {
    const nx = pos.x + dx;
    if (!this.hitsWall(nx, pos.y, radius)) pos.x = nx;
    const ny = pos.y + dy;
    if (!this.hitsWall(pos.x, ny, radius)) pos.y = ny;
  }

  hitsWall(x, y, r) {
    return (
      this.isBlockedPx(x - r, y - r) ||
      this.isBlockedPx(x + r, y - r) ||
      this.isBlockedPx(x - r, y + r) ||
      this.isBlockedPx(x + r, y + r)
    );
  }

  // Line of sight between two points, sampled every 8 px.
  hasLineOfSight(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (blocksSight(this.tileAtPx(ax + dx * t, ay + dy * t))) return false;
    }
    return true;
  }

  // Light level of a tile: 0 = shadow, 1 = normal, 2 = lamp-lit.
  lightAtPx(x, y) {
    const ch = this.tileAtPx(x, y);
    if (ch === T.SHADOW) return 0;
    if (ch === T.LAMP) return 2;
    return 1;
  }

  isBushPx(x, y) {
    return this.tileAtPx(x, y) === T.BUSH;
  }

  lootTotal() {
    return this.shards.length + (this.opal ? 1 : 0);
  }

  lootTaken() {
    let n = this.shards.filter((s) => s.taken).length;
    if (this.opal && this.opal.taken) n++;
    return n;
  }

  // Flood fill from the player start over walkable tiles; used by tests to
  // prove every shard, the opal and the exit can be reached.
  reachableTiles() {
    const seen = new Set();
    const start = [Math.floor(this.playerStart.x / TILE), Math.floor(this.playerStart.y / TILE)];
    const stack = [start];
    seen.add(start.join(','));
    while (stack.length) {
      const [tx, ty] = stack.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx;
        const ny = ty + dy;
        const key = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || seen.has(key)) continue;
        if (blocksMovement(this.grid[ny][nx])) continue;
        seen.add(key);
        stack.push([nx, ny]);
      }
    }
    return seen;
  }
}
