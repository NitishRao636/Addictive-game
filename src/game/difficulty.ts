// Difficulty presets — adjust spawn rate, enemy speed, enemy HP, and player HP.

export type Difficulty = "easy" | "medium" | "hard";

export type DifficultyConfig = {
  key: Difficulty;
  label: string;
  tagline: string;
  accent: string; // tailwind gradient classes for the selected card
  ringClass: string; // ring around selected card
  // Multipliers applied to base CONFIG values
  spawnIntervalMul: number; // >1 = slower spawns
  spawnAccelMul: number; // >1 = accel kicks in slower
  enemySpeedMul: number; // >1 = faster enemies
  enemyHpMul: number; // >1 = tankier enemies
  enemyDamageMul: number; // >1 = bigger hits
  playerHp: number; // absolute override
  scoreMul: number; // score multiplier awarded at game over
};

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    key: "easy",
    label: "Easy",
    tagline: "More hearts, slower spawns",
    accent: "from-emerald-300 via-teal-300 to-sky-400",
    ringClass: "ring-emerald-300/60",
    spawnIntervalMul: 1.5,
    spawnAccelMul: 1.04,
    enemySpeedMul: 0.8,
    enemyHpMul: 0.85,
    enemyDamageMul: 0.5, // round-up so it's at least 1
    playerHp: 7,
    scoreMul: 0.75,
  },
  medium: {
    key: "medium",
    label: "Medium",
    tagline: "The classic challenge",
    accent: "from-amber-300 via-pink-400 to-fuchsia-500",
    ringClass: "ring-amber-300/60",
    spawnIntervalMul: 1.0,
    spawnAccelMul: 1.0,
    enemySpeedMul: 1.0,
    enemyHpMul: 1.0,
    enemyDamageMul: 1.0,
    playerHp: 5,
    scoreMul: 1.0,
  },
  hard: {
    key: "hard",
    label: "Hard",
    tagline: "Fast, fierce, unforgiving",
    accent: "from-rose-400 via-fuchsia-500 to-violet-500",
    ringClass: "ring-rose-300/60",
    spawnIntervalMul: 0.7,
    spawnAccelMul: 0.96,
    enemySpeedMul: 1.25,
    enemyHpMul: 1.25,
    enemyDamageMul: 1.0, // already 1; speed matters more
    playerHp: 3,
    scoreMul: 1.6,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard"];

export function getDifficulty(key: Difficulty | string | null | undefined): DifficultyConfig {
  if (key === "easy" || key === "medium" || key === "hard") return DIFFICULTIES[key];
  return DIFFICULTIES.medium;
}

const STORAGE_KEY = "arrowstorm.difficulty.v1";

export function loadDifficulty(): Difficulty {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "easy" || v === "medium" || v === "hard") return v;
  } catch {
    /* ignore */
  }
  return "medium";
}

export function saveDifficulty(d: Difficulty) {
  try {
    localStorage.setItem(STORAGE_KEY, d);
  } catch {
    /* ignore */
  }
}
