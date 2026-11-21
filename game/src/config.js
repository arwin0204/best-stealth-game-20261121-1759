// Lantern Thief — game configuration: constants, tiles and the three levels.
// Maps are 24 columns by 15 rows. Legend:
//   # wall   . floor   , shadow floor   L lamp-lit floor
//   C crate  S statue  B bush (walkable, blocks a guard's sight when you sneak in it)
//   P player start   * moon shard   O the Moon Opal   E exit   G guard marker (floor)

export const TILE = 40;
export const VIEW_W = 960;
export const VIEW_H = 600;
export const COLS = 24;
export const ROWS = 15;

export const PLAYER_WALK_SPEED = 132;
export const PLAYER_RUN_SPEED = 208;
export const PLAYER_SNEAK_SPEED = 68;
export const PLAYER_RADIUS = 13;

export const GUARD_PATROL_SPEED = 56;
export const GUARD_SUSPICIOUS_SPEED = 82;
export const GUARD_ALERT_SPEED = 138;
export const GUARD_RADIUS = 14;

export const VISION_RANGE = 185;
export const VISION_HALF_ANGLE = 0.61; // ~35 degrees each side
export const DETECT_FILL_RATE = 44; // suspicion per second at point blank, in the open
export const SUSPICIOUS_AT = 30;
export const ALERT_AT = 100;
export const DETECT_DECAY = 30;
export const CATCH_DISTANCE = 25;

export const RUN_NOISE_RADIUS = 150;
export const WALK_NOISE_RADIUS = 55;
export const PEBBLE_NOISE_RADIUS = 225;
export const PEBBLES_PER_LEVEL = 3;
export const HEAR_RADIUS = 210;

export const LEVELS = [
  {
    name: 'The Whisper Gallery',
    sub: 'Level 1 — learn the patrols, take the shards, slip out unseen.',
    seed: 1101,
    map: [
      '########################',
      '#P....,....L.....*.....#',
      '#.....C..........C.....#',
      '#..##......S......##...#',
      '#..##..,..........##...#',
      '#......C.....G.........#',
      '#..B.......##......B...#',
      '#..........##.....,....#',
      '#..*...C...##...C......#',
      '#..........##......G...#',
      '#..##......##..S.......#',
      '#..##..,.......,....*..#',
      '#......C......C........#',
      '#....E.....L......G....#',
      '########################',
    ],
    guards: [
      { spawn: [14, 5], path: [[14, 5], [20, 5], [20, 11], [14, 11]], pause: 1.1 },
      { spawn: [19, 9], path: [[19, 9], [19, 12], [16, 12], [16, 9]], pause: 0.9 },
      { spawn: [18, 13], path: [[18, 13], [6, 13], [6, 11], [18, 11]], pause: 1.3 },
    ],
  },
  {
    name: 'The Vault Hall',
    sub: 'Level 2 — more lamps, tighter patrols, heavier doors.',
    seed: 2202,
    map: [
      '########################',
      '#P...C....,....L....*..#',
      '#....##........##......#',
      '#....##...S...##...C...#',
      '#.,.....B.........,....#',
      '#..C.....##..G....##...#',
      '#.......##......B......#',
      '#..*....##...C....*....#',
      '#.......##........##...#',
      '#..##........G....##...#',
      '#..##..C.....,.....B...#',
      '#......,....##.........#',
      '#..B.......##....C.....#',
      '#....E....L....G....*..#',
      '########################',
    ],
    guards: [
      { spawn: [14, 5], path: [[14, 5], [17, 5], [17, 8], [14, 8]], pause: 0.9 },
      { spawn: [13, 9], path: [[13, 9], [17, 9], [17, 10], [13, 10]], pause: 1.0 },
      { spawn: [15, 13], path: [[15, 13], [21, 13], [21, 10], [15, 10]], pause: 1.2 },
    ],
  },
  {
    name: 'The Moon Opal Chamber',
    sub: 'Level 3 — the Opal waits under four lanterns and four pairs of eyes.',
    seed: 3303,
    map: [
      '########################',
      '#P....,.....O......,...#',
      '#....C.....###.....C...#',
      '#..##......#S#....##...#',
      '#..##..,....#.....,##..#',
      '#......C...#..G...#....#',
      '#..B.......#......#..B.#',
      '#.....,....#..,........#',
      '#..*...C...#...C....*..#',
      '#..........#......G....#',
      '#..##......#..S...##...#',
      '#..##..,....#....##....#',
      '#......C...#..B....C...#',
      '#....E.....#..G....,...#',
      '########################',
    ],
    guards: [
      { spawn: [14, 5], path: [[14, 5], [17, 5], [17, 9], [14, 9]], pause: 0.9 },
      { spawn: [19, 9], path: [[19, 9], [22, 9], [22, 7], [19, 7]], pause: 1.0 },
      { spawn: [14, 13], path: [[14, 13], [18, 13], [18, 12], [14, 12]], pause: 1.1 },
      { spawn: [15, 1], path: [[15, 1], [18, 1], [18, 2], [15, 2]], pause: 1.4 },
    ],
  },
];

// Count the loot (shards + opal) a level holds, from its map text.
export function countLoot(level) {
  let n = 0;
  for (const row of level.map) for (const ch of row) if (ch === '*' || ch === 'O') n++;
  return n;
}
