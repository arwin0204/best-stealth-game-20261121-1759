// Lantern Thief — the game itself: state machine, loop, scoring and wiring.
// Modes: title → play → caught → levelclear → win, with paused over play.

import { TILE, LEVELS, PEBBLES_PER_LEVEL } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Guard } from './guards.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { applyScene } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.sound = new SoundBank();
    this.mode = 'title';
    this.levelIndex = 0;
    this.elapsed = 0;
    this.attempts = 1;
    this.alarms = 0;
    this.score = 0;
    this.now = 0;
    this.bannerLeft = 0;
    this.lootDone = false;
    this.maxMeter = 0;
    this.pebbles = [];
    this.rings = [];
    this.frozen = false;
    this.caughtAt = 0;
    this.loadLevel(0);
    this.input = new Input(
      canvas,
      (x, y) => this.onClick(x, y),
      (code) => this.onKey(code),
    );
    this.lastTs = 0;
    this.stepped = false;
    requestAnimationFrame((ts) => this.loop(ts));
  }

  loadLevel(i) {
    this.levelIndex = i;
    this.world = new World(LEVELS[i]);
    this.player = new Player(this.world);
    this.player.pebbles = PEBBLES_PER_LEVEL;
    this.guards = LEVELS[i].guards.map((def) => new Guard(def, this.world));
    this.pebbles = [];
    this.rings = [];
    this.lootDone = false;
    this.maxMeter = 0;
    this.bannerLeft = 3.2;
  }

  formatTime(ms) {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  onClick(x, y) {
    this.sound.ensure();
    if (this.mode === 'title') return this.startPlay();
    if (this.mode === 'caught') return this.retryLevel();
    if (this.mode === 'levelclear') return this.nextLevel();
    if (this.mode === 'win') return this.restartAll();
    if (this.mode !== 'play' || this.frozen) return;
    const peb = this.player.throwPebble(x, y);
    if (peb) {
      this.pebbles.push(peb);
      this.sound.pebble();
    }
  }

  onKey(code) {
    this.sound.ensure();
    if (code === 'KeyM') {
      const muted = this.sound.toggleMute();
      this.bannerText = muted ? 'Sound off' : 'Sound on';
      return;
    }
    if (code === 'Enter' || code === 'Space') {
      if (this.mode === 'title') return this.startPlay();
      if (this.mode === 'caught') return this.retryLevel();
      if (this.mode === 'levelclear') return this.nextLevel();
      if (this.mode === 'win') return this.restartAll();
    }
    if (code === 'KeyP' || code === 'Escape') {
      if (this.mode === 'play') this.mode = 'paused';
      else if (this.mode === 'paused') this.mode = 'play';
    }
  }

  startPlay() {
    this.mode = 'play';
    this.elapsed = 0;
    this.attempts = 1;
    this.alarms = 0;
    this.score = 0;
    this.loadLevel(0);
  }

  restartAll() {
    this.startPlay();
  }

  retryLevel() {
    this.attempts++;
    this.loadLevel(this.levelIndex);
    this.mode = 'play';
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.mode = 'win';
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.mode = 'play';
  }

  loop(ts) {
    requestAnimationFrame((t) => this.loop(t));
    if (!this.lastTs) this.lastTs = ts;
    let dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;
    if (!this.frozen) this.now += dt * 1000;
    if (this.mode === 'play' && !this.frozen) this.update(dt);
    if (this.mode === 'play' && this.bannerLeft > 0) this.bannerLeft -= dt;
    this.renderer.draw(this);
  }

  update(dt) {
    this.elapsed += dt * 1000;
    const noise = this.player.update(dt, this.input.keys);
    if (noise) {
      this.rings.push({ x: noise.x, y: noise.y, radius: noise.radius, t: 0, life: 0.6 });
      for (const g of this.guards) g.hearNoise(noise.x, noise.y, noise.radius);
      if (this.player.running) this.sound.footstep(true);
    }
    // Pebbles fly, land with a clink, and pull nearby guards over.
    for (const p of this.pebbles) p.t += dt;
    const landed = this.pebbles.filter((p) => p.t >= p.dur);
    this.pebbles = this.pebbles.filter((p) => p.t < p.dur);
    for (const p of landed) {
      this.rings.push({ x: p.tx, y: p.ty, radius: p.radius, t: 0, life: 0.7 });
      for (const g of this.guards) g.hearNoise(p.tx, p.ty, p.radius);
    }
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter((r) => r.t < r.life);

    let alarmNow = false;
    this.maxMeter = 0;
    for (const g of this.guards) {
      const wasAlert = g.state === 'alert';
      g.update(dt, this.player, this.now / 1000);
      this.maxMeter = Math.max(this.maxMeter, g.meter);
      if (g.state === 'alert') alarmNow = true;
      if (g.state === 'alert' && !wasAlert) {
        this.alarms++;
        this.sound.alarm();
      } else if (g.state === 'suspicious' && g.meter >= 30 && g.meter < 34) {
        this.sound.suspicious();
      }
      if (g.catches(this.player)) return this.getCaught();
    }
    if (alarmNow) this.alarmFlash = 1;

    // Pickups: walk onto a shard or the Opal to take it.
    for (const s of this.world.shards) {
      if (!s.taken && Math.hypot(s.x - this.player.x, s.y - this.player.y) < 28) {
        s.taken = true;
        this.sound.pickup();
      }
    }
    const op = this.world.opal;
    if (op && !op.taken && Math.hypot(op.x - this.player.x, op.y - this.player.y) < 30) {
      op.taken = true;
      this.sound.pickup();
    }
    this.lootDone = this.world.lootTaken() >= this.world.lootTotal();

    // The exit opens once every piece of loot is taken.
    const e = this.world.exit;
    if (this.lootDone && e && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 30) {
      this.score += Math.max(500, 6000 - Math.floor(this.elapsed / 1000) * 12 - this.alarms * 400);
      if (this.levelIndex + 1 >= LEVELS.length) {
        this.mode = 'win';
        this.sound.win();
      } else {
        this.mode = 'levelclear';
        this.sound.levelClear();
      }
    }
  }

  getCaught() {
    this.mode = 'caught';
    this.caughtAt = this.now;
    this.sound.caught();
  }
}

// Boot: build the game on the page's canvas and stage a screenshot scene
// when the URL asks for one (?scene=title|play|alarm|win).
const canvas = document.getElementById('game');
const game = new Game(canvas);
applyScene(game);

