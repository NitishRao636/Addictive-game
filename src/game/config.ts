// Game tuning constants
export const CONFIG = {
  player: {
    radius: 16,
    speed: 360, // px/sec
    invulnAfterHit: 1.0, // sec
    maxHp: 5,
  },
  arrow: {
    speed: 720,
    radius: 4,
    life: 1.6, // seconds
    fireRate: 0.16, // sec between shots
    damage: 1,
  },
  enemy: {
    spawnInterval: 1.1,
    spawnIntervalMin: 0.32,
    spawnAccel: 0.985, // multiply interval each spawn
    baseSpeed: 70,
    speedPerWave: 8,
    radius: 22,
    contactDamage: 1,
    splitterSplits: 2,
  },
  wave: {
    duration: 22, // seconds per wave
    enemiesPerWaveBase: 8,
    enemiesPerWaveGrowth: 4,
    breakDuration: 2.5,
  },
  screenShake: {
    decay: 6.5,
    max: 28,
  },
  hitStop: {
    duration: 0.05,
  },
  visuals: {
    bgHue1: 264,
    bgHue2: 200,
  },
};
