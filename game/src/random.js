// Deterministic seeded random numbers (mulberry32). Every run of the game
// with the same seed produces the same sequence, so replays and screenshots
// are reproducible.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick a stable pseudo-random value for one tile, for floor shading and
// for the dust motes that drift through the lamplight.
export function tileHash(tx, ty, seed) {
  let h = (seed ^ Math.imul(tx + 1, 374761393) ^ Math.imul(ty + 1, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
