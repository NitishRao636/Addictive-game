// Game type definitions

export type Vec2 = { x: number; y: number };

export type GameState = "menu" | "playing" | "paused" | "gameover";

export type Arrow = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  life: number; // seconds remaining
  trail: Vec2[];
  hue: number;
};

export type Enemy = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  hue: number;
  spawnTime: number;
  // visual wobble phase
  phase: number;
  // type influences behavior & appearance
  kind: "grunt" | "speedy" | "tank" | "splitter";
  // splitter: pending split count
  splitCount?: number;
  hitFlash: number;
};

export type Particle = {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  kind: "spark" | "ring" | "shard" | "text" | "glow";
  text?: string;
  rotation: number;
  rotationSpeed: number;
  gravity?: number;
};

export type ScorePopup = {
  id: number;
  pos: Vec2;
  text: string;
  hue: number;
  life: number;
};

export type InputState = {
  aimX: number; // -1..1
  aimY: number; // -1..1
  aimAngle: number; // computed
  moveX: number; // -1..1
  moveY: number; // -1..1
  shoot: boolean;
  pause: boolean;
  pointerActive: boolean;
  // optional raw mouse pixel coords (engine reads them when aimX/Y are zero)
  mouseX?: number;
  mouseY?: number;
};

export type HighScoreEntry = {
  score: number;
  wave: number;
  arrows: number;
  accuracy: number;
  date: string;
};
