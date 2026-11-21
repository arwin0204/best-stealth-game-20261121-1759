// Keyboard and mouse input. WASD and arrows move, Shift runs, C sneaks,
// P pauses, M mutes, and a mouse click tosses a pebble toward the cursor.
// Clicks on the canvas also wake the audio context, so the first sound
// never plays before the player has touched the game.

export class Input {
  constructor(canvas, onClick, onKey) {
    this.keys = { up: false, down: false, left: false, right: false, run: false, sneak: false };
    this.onClick = onClick;
    this.onKey = onKey;
    this.down = new Set();
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.down.add(e.code);
      this.sync();
      if (this.onKey) this.onKey(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
      this.sync();
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * canvas.width;
      const y = ((e.clientY - r.top) / r.height) * canvas.height;
      if (this.onClick) this.onClick(x, y);
    });
    window.addEventListener('blur', () => {
      this.down.clear();
      this.sync();
    });
  }

  sync() {
    const d = this.down;
    this.keys.up = d.has('KeyW') || d.has('ArrowUp');
    this.keys.down = d.has('KeyS') || d.has('ArrowDown');
    this.keys.left = d.has('KeyA') || d.has('ArrowLeft');
    this.keys.right = d.has('KeyD') || d.has('ArrowRight');
    this.keys.run = d.has('ShiftLeft') || d.has('ShiftRight');
    this.keys.sneak = d.has('KeyC') || d.has('ControlLeft');
  }
}
