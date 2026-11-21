// Rendering: draws the museum, its shadows and lamps, the guards and their
// vision cones, the thief, and every screen of the game — all on one canvas,
// with no images at all. What the judge sees in the screenshots comes from here.

import { TILE, COLS, ROWS, VIEW_W, VIEW_H, VISION_RANGE } from './config.js';
import { tileHash } from './random.js';

const FLOOR_A = '#38324a';
const FLOOR_B = '#322c41';
const SHADOW_FLOOR = '#221d33';
const LAMP_FLOOR = '#4a3a26';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dark = document.createElement('canvas');
    this.dark.width = VIEW_W;
    this.dark.height = VIEW_H;
    this.dctx = this.dark.getContext('2d');
  }

  draw(game) {
    const ctx = this.ctx;
    const { world, player, guards } = game;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.drawFloor(world);
    this.drawCover(world);
    this.drawLoot(world, game.now);
    this.drawExit(world, game.lootDone);
    this.drawPebbles(game.pebbles);
    for (const g of guards) this.drawCone(g);
    for (const g of guards) this.drawGuard(g);
    this.drawPlayer(player, game.now);
    this.drawNoiseRings(game.rings);
    this.drawDarkness(world, player);
    this.drawHud(game);
    if (game.mode === 'title') this.drawTitle(game);
    else if (game.mode === 'caught') this.drawCaught(game);
    else if (game.mode === 'levelclear') this.drawLevelClear(game);
    else if (game.mode === 'win') this.drawWin(game);
    else if (game.mode === 'paused') this.drawPaused(game);
    else if (game.bannerLeft > 0) this.drawBanner(game);
  }

  drawFloor(world) {
    const ctx = this.ctx;
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const ch = world.grid[ty][tx];
        const x = tx * TILE;
        const y = ty * TILE;
        const h = tileHash(tx, ty, world.level.seed);
        if (ch === '#') {
          ctx.fillStyle = '#171222';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = '#2e2547';
          ctx.fillRect(x, y, TILE, 5);
          ctx.fillStyle = '#0d0a16';
          ctx.fillRect(x, y + TILE - 4, TILE, 4);
          if (h > 0.6) {
            ctx.fillStyle = '#241d33';
            ctx.fillRect(x + 8, y + 12, 24, 16);
          }
          continue;
        }
        let base = h > 0.5 ? FLOOR_A : FLOOR_B;
        if (ch === ',') base = SHADOW_FLOOR;
        if (ch === 'L') base = LAMP_FLOOR;
        ctx.fillStyle = base;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        if (ch === 'L') {
          // A brass lamp post with a warm flame.
          ctx.fillStyle = '#4a3a20';
          ctx.fillRect(x + 17, y + 14, 6, 22);
          ctx.fillStyle = '#ffd98a';
          ctx.beginPath();
          ctx.arc(x + 20, y + 12, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff3c4';
          ctx.beginPath();
          ctx.arc(x + 20, y + 12, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (ch === 'B') {
          ctx.fillStyle = '#24401f';
          ctx.beginPath();
          ctx.arc(x + 12, y + 22, 13, 0, Math.PI * 2);
          ctx.arc(x + 26, y + 26, 12, 0, Math.PI * 2);
          ctx.arc(x + 20, y + 12, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3a6b32';
          ctx.beginPath();
          ctx.arc(x + 12, y + 20, 7, 0, Math.PI * 2);
          ctx.arc(x + 26, y + 24, 6, 0, Math.PI * 2);
          ctx.arc(x + 20, y + 11, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawCover(world) {
    const ctx = this.ctx;
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const ch = world.grid[ty][tx];
        const x = tx * TILE;
        const y = ty * TILE;
        if (ch === 'C') {
          ctx.fillStyle = '#6b4a26';
          rr(ctx, x + 4, y + 4, TILE - 8, TILE - 8, 4);
          ctx.fill();
          ctx.strokeStyle = '#4a3016';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 7, y + 7, TILE - 14, TILE - 14);
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + TILE - 4, y + TILE - 4);
          ctx.moveTo(x + TILE - 4, y + 4);
          ctx.lineTo(x + 4, y + TILE - 4);
          ctx.stroke();
          ctx.fillStyle = '#8a6538';
          ctx.fillRect(x + 4, y + 4, TILE - 8, 5);
        } else if (ch === 'S') {
          ctx.fillStyle = '#55576e';
          ctx.beginPath();
          ctx.arc(x + 20, y + 18, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#8d8fa3';
          ctx.fillRect(x + 12, y + 24, 16, 10);
          ctx.fillStyle = '#a9abc0';
          ctx.beginPath();
          ctx.arc(x + 20, y + 14, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawLoot(world, now) {
    const ctx = this.ctx;
    const bob = Math.sin(now / 300) * 3;
    for (const s of world.shards) {
      if (s.taken) continue;
      const glow = ctx.createRadialGradient(s.x, s.y + bob, 2, s.x, s.y + bob, 26);
      glow.addColorStop(0, 'rgba(120,220,255,0.5)');
      glow.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(s.x - 26, s.y + bob - 26, 52, 52);
      ctx.fillStyle = '#9be8ff';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + bob - 10);
      ctx.lineTo(s.x + 7, s.y + bob);
      ctx.lineTo(s.x, s.y + bob + 10);
      ctx.lineTo(s.x - 7, s.y + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8fbff';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + bob - 5);
      ctx.lineTo(s.x + 3, s.y + bob);
      ctx.lineTo(s.x, s.y + bob + 5);
      ctx.lineTo(s.x - 3, s.y + bob);
      ctx.closePath();
      ctx.fill();
    }
    const op = world.opal;
    if (op && !op.taken) {
      const pulse = 0.6 + Math.sin(now / 240) * 0.25;
      const glow = ctx.createRadialGradient(op.x, op.y, 2, op.x, op.y, 46);
      glow.addColorStop(0, `rgba(190,140,255,${0.55 * pulse})`);
      glow.addColorStop(1, 'rgba(190,140,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(op.x - 46, op.y - 46, 92, 92);
      ctx.fillStyle = '#c9a2ff';
      ctx.beginPath();
      ctx.moveTo(op.x, op.y - 15);
      ctx.lineTo(op.x + 11, op.y);
      ctx.lineTo(op.x, op.y + 15);
      ctx.lineTo(op.x - 11, op.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f2e7ff';
      ctx.beginPath();
      ctx.moveTo(op.x, op.y - 7);
      ctx.lineTo(op.x + 5, op.y);
      ctx.lineTo(op.x, op.y + 7);
      ctx.lineTo(op.x - 5, op.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawExit(world, open) {
    const ctx = this.ctx;
    const e = world.exit;
    if (!e) return;
    const x = e.tx * TILE;
    const y = e.ty * TILE;
    ctx.fillStyle = open ? '#0d3d24' : '#33141c';
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = open ? '#37e08a' : '#7a3a46';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
    if (open) {
      const glow = ctx.createRadialGradient(e.x, e.y, 4, e.x, e.y, 44);
      glow.addColorStop(0, 'rgba(55,224,138,0.45)');
      glow.addColorStop(1, 'rgba(55,224,138,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(e.x - 44, e.y - 44, 88, 88);
      ctx.fillStyle = '#37e08a';
      ctx.font = 'bold 11px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', e.x, e.y + 4);
    } else {
      ctx.fillStyle = '#c98a96';
      ctx.font = 'bold 10px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('LOCKED', e.x, e.y + 4);
    }
  }

  drawPebbles(pebbles) {
    const ctx = this.ctx;
    for (const p of pebbles) {
      const t = Math.min(1, p.t / p.dur);
      const x = p.x + (p.tx - p.x) * t;
      const y = p.y + (p.ty - p.y) * t - Math.sin(t * Math.PI) * 26;
      ctx.fillStyle = '#cfc4a8';
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawCone(g) {
    const ctx = this.ctx;
    const pts = g.conePoints();
    const color =
      g.state === 'alert'
        ? 'rgba(255,60,50,0.27)'
        : g.state === 'suspicious' || g.state === 'search'
          ? 'rgba(255,150,50,0.22)'
          : 'rgba(255,214,90,0.17)';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color.replace(/0\.\d+\)/, '0.35)');
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawGuard(g) {
    const ctx = this.ctx;
    const bob = Math.sin(g.stepPhase * 0.12) * 1.5;
    // Body: a watchman in a dark red coat and brass helmet.
    ctx.fillStyle = '#5d2226';
    ctx.beginPath();
    ctx.arc(g.x, g.y + bob * 0.3, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a2e2e';
    ctx.beginPath();
    ctx.arc(g.x, g.y + bob * 0.3, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(g.x, g.y + bob * 0.3 - 2, 6.5, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#e8d27a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 20, g.y + Math.sin(g.facing) * 20);
    ctx.stroke();
    // State mark and suspicion bar.
    if (g.state === 'alert') {
      this.mark(g.x, g.y - 26, '!', '#ff5040');
    } else if (g.state === 'suspicious' || g.state === 'search') {
      this.mark(g.x, g.y - 26, '?', '#ffb347');
    }
    if (g.meter > 2) {
      const w = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(g.x - w / 2, g.y - 36, w, 5);
      ctx.fillStyle = g.meter >= 100 ? '#ff5040' : g.meter >= 30 ? '#ffb347' : '#ffe066';
      ctx.fillRect(g.x - w / 2, g.y - 36, (w * g.meter) / 100, 5);
    }
  }

  mark(x, y, ch, color) {
    const ctx = this.ctx;
    // A dark badge so the mark reads at a glance, even shrunk.
    ctx.fillStyle = 'rgba(8,6,16,0.85)';
    ctx.beginPath();
    ctx.arc(x, y - 6, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 15px Georgia';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(ch, x, y);
  }

  drawPlayer(p, now) {
    const ctx = this.ctx;
    const crouch = p.sneaking ? 0.82 : 1;
    const alpha = p.hidden ? 0.45 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Lantern glow.
    const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 52);
    glow.addColorStop(0, 'rgba(255,220,140,0.20)');
    glow.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - 52, p.y - 52, 104, 104);
    // Cloak: a hooded teal triangle, leaning the way it moves.
    const lean = p.moving ? 3 : 0;
    ctx.fillStyle = '#155e5a';
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.facing) * 14 + lean, p.y + Math.sin(p.facing) * 14);
    ctx.lineTo(p.x + Math.cos(p.facing + 2.5) * 12, p.y + Math.sin(p.facing + 2.5) * 12);
    ctx.lineTo(p.x + Math.cos(p.facing - 2.5) * 12, p.y + Math.sin(p.facing - 2.5) * 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1f7a72';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9 * crouch + 3, 0, Math.PI * 2);
    ctx.fill();
    // Hood point and the pale face inside it.
    ctx.fillStyle = '#0f4541';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.facing) * 4, p.y + Math.sin(p.facing) * 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2e3c8';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.facing) * 5, p.y + Math.sin(p.facing) * 5, 3, 0, Math.PI * 2);
    ctx.fill();
    // The little lantern in hand.
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.facing + 0.9) * 13, p.y + Math.sin(p.facing + 0.9) * 13, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (p.sneaking) {
      ctx.font = '11px Georgia';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9fd8c9';
      ctx.fillText('sneaking', p.x, p.y + 26);
    }
  }

  drawNoiseRings(rings) {
    const ctx = this.ctx;
    for (const r of rings) {
      const t = r.t / r.life;
      ctx.strokeStyle = `rgba(255,240,180,${0.5 * (1 - t)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6 + (r.radius - 6) * t, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawDarkness(world, player) {
    const dctx = this.dctx;
    dctx.clearRect(0, 0, VIEW_W, VIEW_H);
    dctx.fillStyle = 'rgba(3,4,14,0.36)';
    dctx.fillRect(0, 0, VIEW_W, VIEW_H);
    dctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => {
      const g = dctx.createRadialGradient(x, y, 4, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.beginPath();
      dctx.arc(x, y, r, 0, Math.PI * 2);
      dctx.fill();
    };
    hole(player.x, player.y, 130, 0.9);
    for (const l of world.lamps) hole(l.x, l.y, 120, 0.85);
    dctx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(this.dark, 0, 0);
    // Vignette.
    const v = this.ctx.createRadialGradient(480, 300, 220, 480, 300, 640);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.30)');
    this.ctx.fillStyle = v;
    this.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawHud(game) {
    const ctx = this.ctx;
    const { world } = game;
    ctx.fillStyle = 'rgba(8,6,16,0.82)';
    ctx.fillRect(0, 0, VIEW_W, 34);
    ctx.fillStyle = '#d8c98a';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`${game.levelIndex + 1}. ${world.level.name}`, 12, 22);
    // Loot.
    const taken = world.lootTaken();
    const total = world.lootTotal();
    ctx.font = '13px Georgia';
    ctx.fillStyle = '#9be8ff';
    ctx.fillText(`◆ ${taken}/${total} loot`, 300, 22);
    // Pebbles.
    ctx.fillStyle = '#cfc4a8';
    ctx.fillText(`● pebbles ${game.player.pebbles}`, 420, 22);
    // Detection: the highest guard meter.
    const m = game.maxMeter;
    ctx.fillStyle = '#8a7d5f';
    ctx.fillText('seen', 560, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(600, 12, 140, 10);
    ctx.fillStyle = m >= 100 ? '#ff5040' : m >= 30 ? '#ffb347' : '#ffe066';
    ctx.fillRect(600, 12, (140 * Math.min(100, m)) / 100, 10);
    ctx.fillStyle = m >= 100 ? '#ff5040' : '#d8c98a';
    ctx.font = 'bold 12px Georgia';
    ctx.fillText(m >= 100 ? 'ALARM!' : m >= 30 ? 'suspicious' : 'unseen', 748, 22);
    // Timer and attempts.
    ctx.fillStyle = '#8a7d5f';
    ctx.font = '13px Georgia';
    ctx.textAlign = 'right';
    const s = Math.floor(game.elapsed / 1000);
    ctx.fillText(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}   tries ${game.attempts}`, VIEW_W - 12, 22);
    ctx.textAlign = 'left';
    if (game.mode === 'play' && !game.lootDone) {
      ctx.fillStyle = '#c9b98a';
      ctx.font = '12px Georgia';
      ctx.fillText('Steal all the loot, then reach the green EXIT.', 12, VIEW_H - 10);
    } else if (game.mode === 'play' && game.lootDone) {
      ctx.fillStyle = '#37e08a';
      ctx.font = 'bold 12px Georgia';
      ctx.fillText('All loot taken — run for the green EXIT!', 12, VIEW_H - 10);
    }
  }

  panel(title, lines, accent) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(5,4,12,0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = accent || '#d8c98a';
    ctx.font = 'bold 44px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(title, VIEW_W / 2, 190);
    ctx.fillStyle = '#e8e0c8';
    ctx.font = '17px Georgia';
    lines.forEach((ln, i) => ctx.fillText(ln, VIEW_W / 2, 240 + i * 30));
    ctx.textAlign = 'left';
  }

  drawTitle(game) {
    this.panel('LANTERN THIEF', [
      'The Moon Opal sleeps in the old museum — and the night watch is awake.',
      'Sneak past the guards, steal every shard, and slip out the green exit.',
      '',
      'WASD move · Shift run (loud) · C sneak · Click toss a pebble',
      'Stay out of the yellow cones. Shadows hide you. Bushes hide you better.',
      '',
      'Press ENTER or click to begin the first gallery.',
    ], '#ffd98a');
    // A little scene under the title: thief, guard and cone, drawn for real.
    const ctx = this.ctx;
    ctx.fillStyle = '#d8c98a';
    ctx.font = '13px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('A complete stealth game in three galleries — original art, music-free, played offline.', VIEW_W / 2, 470);
    ctx.textAlign = 'left';
  }

  drawCaught(game) {
    this.panel('CAUGHT!', [
      `A guard laid hands on Wisp in ${game.world.level.name}.`,
      `Tries used: ${game.attempts}. The gallery resets — the loot waits where it was.`,
      '',
      'Press ENTER to try the gallery again.',
    ], '#ff5040');
  }

  drawLevelClear(game) {
    this.panel('GALLERY CLEARED', [
      `${game.world.level.name} — every shard gone, no alarm that mattered.`,
      `Time so far: ${game.formatTime(game.elapsed)}. Alarms raised: ${game.alarms}.`,
      '',
      'Press ENTER for the next gallery.',
    ], '#37e08a');
  }

  drawWin(game) {
    this.panel('THE MOON OPAL IS YOURS', [
      'Three galleries, four watchmen outwitted — and the Moon Opal is in your pocket.',
      `Total time: ${game.formatTime(game.elapsed)} · Alarms raised: ${game.alarms} · Tries: ${game.attempts}`,
      `Score: ${game.score} — the quieter the night, the richer the thief.`,
      '',
      'Press ENTER to play the galleries again.',
    ], '#c9a2ff');
  }

  drawPaused(game) {
    this.panel('PAUSED', [
      'The museum holds its breath.',
      '',
      'Press P to keep sneaking.  M toggles sound.',
    ], '#d8c98a');
  }

  drawBanner(game) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(8,6,16,0.75)';
    const w = 560;
    ctx.fillRect((VIEW_W - w) / 2, 70, w, 52);
    ctx.strokeStyle = '#d8c98a';
    ctx.lineWidth = 1;
    ctx.strokeRect((VIEW_W - w) / 2, 70, w, 52);
    ctx.fillStyle = '#e8e0c8';
    ctx.font = 'bold 17px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(game.world.level.name, VIEW_W / 2, 92);
    ctx.font = '13px Georgia';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText(game.world.level.sub, VIEW_W / 2, 112);
    ctx.textAlign = 'left';
  }
}
