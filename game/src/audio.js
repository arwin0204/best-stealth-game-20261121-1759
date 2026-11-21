// Sound, synthesised live with WebAudio: no audio files, no network, and
// nothing to download before the first footstep. Footsteps, a pebble's
// clink, a pickup chime, the alarm sting and the win arpeggio are all short
// oscillator envelopes, quiet enough to play at night.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.16;
        this.master.connect(this.ctx.destination);
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.5, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  footstep(running) {
    this.tone(running ? 140 : 95, 0.07, 'triangle', running ? 0.5 : 0.22);
  }

  pebble() {
    this.tone(1250, 0.09, 'square', 0.25, 900);
    setTimeout(() => this.tone(1750, 0.08, 'square', 0.18, 1300), 90);
  }

  pickup() {
    this.tone(660, 0.12, 'sine', 0.5);
    setTimeout(() => this.tone(990, 0.16, 'sine', 0.5), 90);
  }

  suspicious() {
    this.tone(420, 0.16, 'sawtooth', 0.22, 520);
  }

  alarm() {
    this.tone(220, 0.28, 'sawtooth', 0.5, 440);
    setTimeout(() => this.tone(440, 0.28, 'sawtooth', 0.5, 220), 200);
  }

  caught() {
    this.tone(330, 0.5, 'sawtooth', 0.5, 82);
  }

  levelClear() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'sine', 0.5), i * 110));
  }

  win() {
    [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sine', 0.5), i * 130));
  }
}
