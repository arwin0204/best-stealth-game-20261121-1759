// Guard AI: patrols, suspicion, alarm, chase and search.
// A guard's eyes are a cone; what fills it is distance, light and how loud
// and how low you move. A glimpse makes it curious, a full meter raises the
// alarm, and a caught thief ends the attempt.

import {
  TILE,
  VISION_RANGE,
  VISION_HALF_ANGLE,
  DETECT_FILL_RATE,
  SUSPICIOUS_AT,
  ALERT_AT,
  DETECT_DECAY,
  GUARD_PATROL_SPEED,
  GUARD_SUSPICIOUS_SPEED,
  GUARD_ALERT_SPEED,
  GUARD_RADIUS,
  CATCH_DISTANCE,
  HEAR_RADIUS,
} from './config.js';

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

export class Guard {
  constructor(def, world) {
    this.world = world;
    const s = tileCenter(def.spawn[0], def.spawn[1]);
    this.x = s.x;
    this.y = s.y;
    this.path = def.path.map(([tx, ty]) => tileCenter(tx, ty));
    this.waypoint = 1 % this.path.length;
    this.pause = def.pause ?? 1;
    this.pauseLeft = 0;
    this.facing = 0;
    this.state = 'patrol'; // patrol | suspicious | alert | search
    this.meter = 0; // 0..100 suspicion
    this.lastSeen = null;
    this.investigate = null;
    this.loseSight = 0;
    this.searchLeft = 0;
    this.scanDir = 1;
    this.stepPhase = 0;
    this.heardAt = 0;
  }

  // How fast this guard fills its suspicion meter for the player right now.
  // Returns 0 when the player cannot be seen at all.
  seePlayer(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > VISION_RANGE) return 0;
    const ang = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(ang, this.facing)) > VISION_HALF_ANGLE) return 0;
    if (!this.world.hasLineOfSight(this.x, this.y, player.x, player.y)) return 0;
    // Hidden in a bush while sneaking: invisible, however close — the
    // oldest trick in the thief's book, and the reason bushes are cover.
    if (player.sneaking && this.world.isBushPx(player.x, player.y)) return 0;
    const closeness = Math.max(0.15, 1.15 - dist / VISION_RANGE);
    const light = this.world.lightAtPx(player.x, player.y);
    const lightFactor = light === 0 ? 0.45 : light === 2 ? 1.35 : 1.0;
    const stance = player.sneaking ? 0.5 : player.running ? 1.7 : 1.0;
    return DETECT_FILL_RATE * closeness * lightFactor * stance;
  }

  hearNoise(x, y, radius) {
    const d = Math.hypot(x - this.x, y - this.y);
    if (d > radius + HEAR_RADIUS * 0.4) return;
    if (this.state === 'alert') return;
    this.investigate = { x, y };
    if (this.state === 'patrol') this.state = 'suspicious';
    this.meter = Math.max(this.meter, SUSPICIOUS_AT * 0.6);
  }

  update(dt, player, now) {
    const fill = this.seePlayer(player);
    if (fill > 0) {
      this.meter = Math.min(ALERT_AT, this.meter + fill * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.loseSight = 0;
      if (this.meter >= ALERT_AT && this.state !== 'alert') {
        this.state = 'alert';
        this.investigate = null;
      } else if (this.meter >= SUSPICIOUS_AT && this.state === 'patrol') {
        this.state = 'suspicious';
        this.investigate = { x: player.x, y: player.y };
      }
    } else {
      this.meter = Math.max(0, this.meter - DETECT_DECAY * dt);
      if (this.state === 'alert') {
        this.loseSight += dt;
        if (this.loseSight > 3.5) {
          this.state = 'search';
          this.searchLeft = 2.6;
          this.investigate = this.lastSeen ? { ...this.lastSeen } : null;
        }
      } else if (this.state === 'suspicious' && this.meter < SUSPICIOUS_AT * 0.4) {
        this.state = 'patrol';
        this.investigate = null;
      }
    }

    let target = null;
    let speed = GUARD_PATROL_SPEED;
    if (this.state === 'alert') {
      speed = GUARD_ALERT_SPEED;
      target = this.lastSeen ? { ...this.lastSeen } : null;
      if (fill > 0) target = { x: player.x, y: player.y };
    } else if (this.state === 'suspicious' && this.investigate) {
      speed = GUARD_SUSPICIOUS_SPEED;
      target = this.investigate;
    } else if (this.state === 'search') {
      this.searchLeft -= dt;
      this.facing += this.scanDir * 1.6 * dt;
      if (this.searchLeft <= 0) {
        this.state = 'patrol';
        this.investigate = null;
        this.meter = Math.max(this.meter, 0);
      }
      return;
    } else {
      // Patrol: walk the waypoints, pausing and looking around at each one.
      if (this.pauseLeft > 0) {
        this.pauseLeft -= dt;
        this.facing += Math.sin(now * 0.9 + this.x) * 0.35 * dt;
        return;
      }
      target = this.path[this.waypoint];
    }

    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) {
        if (this.state === 'patrol') {
          this.waypoint = (this.waypoint + 1) % this.path.length;
          this.pauseLeft = this.pause;
        } else {
          // Reached the investigated spot: look around, then go back.
          this.state = 'search';
          this.searchLeft = 2.2;
          this.investigate = null;
        }
        return;
      }
      const step = Math.min(dist, speed * dt);
      const nx = this.x + (dx / dist) * step;
      const ny = this.y + (dy / dist) * step;
      this.world.moveCircle(this, nx - this.x, ny - this.y, GUARD_RADIUS);
      this.facing = angleTo(this.x, this.y, this.x + dx, this.y + dy);
      this.stepPhase += step;
    }
  }

  catches(player) {
    return Math.hypot(player.x - this.x, player.y - this.y) < CATCH_DISTANCE;
  }

  // Cone polygon for rendering, clipped by nothing (walls shade it in render).
  conePoints() {
    const pts = [{ x: this.x, y: this.y }];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = this.facing - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / steps;
      pts.push({ x: this.x + Math.cos(a) * VISION_RANGE, y: this.y + Math.sin(a) * VISION_RANGE });
    }
    return pts;
  }
}
