// The thief: movement, stance, noise, pebbles and pickups.
// Walk is quiet-ish, run is fast and loud, sneak is slow and hard to see.

import {
  PLAYER_WALK_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_SNEAK_SPEED,
  PLAYER_RADIUS,
  RUN_NOISE_RADIUS,
  WALK_NOISE_RADIUS,
  PEBBLE_NOISE_RADIUS,
} from './config.js';

export class Player {
  constructor(world) {
    this.world = world;
    this.reset();
  }

  reset() {
    this.x = this.world.playerStart.x;
    this.y = this.world.playerStart.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 0;
    this.running = false;
    this.sneaking = false;
    this.moving = false;
    this.pebbles = 3;
    this.noiseCooldown = 0;
    this.stepPhase = 0;
    this.hidden = false;
  }

  // keys: {up,down,left,right,run,sneak}; dt seconds. Returns a noise event
  // ({x, y, radius}) when a footstep is loud enough to be heard, else null.
  update(dt, keys) {
    let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    this.moving = dx !== 0 || dy !== 0;
    this.sneaking = !!keys.sneak;
    this.running = !!keys.run && !this.sneaking && this.moving;
    const speed = this.sneaking
      ? PLAYER_SNEAK_SPEED
      : this.running
        ? PLAYER_RUN_SPEED
        : PLAYER_WALK_SPEED;
    let noise = null;
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.world.moveCircle(this, dx * speed * dt, dy * speed * dt, PLAYER_RADIUS);
      this.facing = Math.atan2(dy, dx);
      this.stepPhase += speed * dt;
      this.noiseCooldown -= dt;
      if (this.noiseCooldown <= 0) {
        if (this.running) {
          noise = { x: this.x, y: this.y, radius: RUN_NOISE_RADIUS };
          this.noiseCooldown = 0.34;
        } else if (!this.sneaking) {
          noise = { x: this.x, y: this.y, radius: WALK_NOISE_RADIUS };
          this.noiseCooldown = 0.8;
        }
      }
    }
    this.hidden = this.sneaking && this.world.isBushPx(this.x, this.y);
    return noise;
  }

  // Toss a pebble toward (x, y): it flies at most 260 px, lands with a
  // clink, and pulls every guard in earshot toward the sound.
  // Returns the pebble or null when out of pebbles.
  throwPebble(x, y) {
    if (this.pebbles <= 0) return null;
    this.pebbles--;
    const dx = x - this.x;
    const dy = y - this.y;
    const dist = Math.min(Math.hypot(dx, dy), 260);
    const a = Math.atan2(dy, dx);
    return {
      x: this.x,
      y: this.y,
      tx: this.x + Math.cos(a) * dist,
      ty: this.y + Math.sin(a) * dist,
      t: 0,
      dur: 0.45,
      radius: PEBBLE_NOISE_RADIUS,
    };
  }
}
