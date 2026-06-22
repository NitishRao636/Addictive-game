import { CONFIG } from "./config";
import type {
  Arrow,
  Enemy,
  GameState,
  InputState,
  Particle,
  ScorePopup,
  Vec2,
} from "./types";
import { sfx } from "./audio";
import type { Difficulty, DifficultyConfig } from "./difficulty";
import { DIFFICULTIES } from "./difficulty";

export type EngineStats = {
  fps: number;
  state: GameState;
  score: number;
  wave: number;
  waveTimer: number;
  hp: number;
  maxHp: number;
  arrows: number;
  hits: number;
  combo: number;
  comboTimer: number;
  shake: number;
  hitStop: number;
  accuracy: number;
  paused: boolean;
  width: number;
  height: number;
  playerPos: Vec2;
  aimAngle: number;
  showWaveBanner: number;
  waveBannerText: string;
  isNewBest: boolean;
  lastResult: null | { score: number; wave: number };
  difficulty: Difficulty;
  difficultyLabel: string;
  scoreMul: number;
};

let nextId = 1;
const id = () => nextId++;

export type EngineEvents = {
  onDamage: () => void;
  onKill: (pos: Vec2, score: number) => void;
  onShoot: () => void;
  onWaveStart: (n: number) => void;
  onGameOver: (score: number, wave: number) => void;
};

export class Engine {
  state: GameState = "menu";
  width = 1;
  height = 1;
  player: Vec2 = { x: 0, y: 0 };
  playerRadius = CONFIG.player.radius;
  playerHp = CONFIG.player.maxHp;
  playerMaxHp = CONFIG.player.maxHp;
  playerInvuln = 0;
  aimAngle = 0;
  arrows: Arrow[] = [];
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  popups: ScorePopup[] = [];
  spawnTimer = 0;
  spawnInterval = CONFIG.enemy.spawnInterval;
  spawnIntervalBase = CONFIG.enemy.spawnInterval;
  spawnAccelBase = CONFIG.enemy.spawnAccel;
  enemySpeedBase = CONFIG.enemy.baseSpeed;
  enemySpeedPerWaveBase = CONFIG.enemy.speedPerWave;
  difficulty: DifficultyConfig = DIFFICULTIES.medium;
  wave = 0;
  waveTimer = 0;
  waveBreakTimer = 0;
  inWaveBreak = false;
  showWaveBanner = 0;
  waveBannerText = "";
  fireCooldown = 0;
  score = 0;
  arrowsFired = 0;
  arrowsHit = 0;
  combo = 0;
  comboTimer = 0;
  shake = 0;
  hitStop = 0;
  isNewBest = false;
  lastResult: null | { score: number; wave: number } = null;
  // ambient starfield
  stars: { x: number; y: number; z: number; hue: number }[] = [];
  // for fps
  private fpsTimer = 0;
  private fpsFrames = 0;
  fps = 60;

  events: EngineEvents;

  constructor(events: EngineEvents) {
    this.events = events;
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    if (this.player.x === 0 && this.player.y === 0) {
      this.player = { x: w / 2, y: h / 2 };
    }
    // Build / rebuild starfield
    const target = Math.floor((w * h) / 7000);
    if (Math.abs(this.stars.length - target) > 30) {
      this.stars = new Array(target).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 1 + 0.2,
        hue: 200 + Math.random() * 80,
      }));
    }
  }

  startGame() {
    this.state = "playing";
    this.score = 0;
    this.wave = 0;
    this.waveTimer = 0;
    this.waveBreakTimer = 0;
    this.inWaveBreak = false;
    // Apply difficulty: HP, spawn cadence, enemy stats
    this.playerMaxHp = this.difficulty.playerHp;
    this.playerHp = this.playerMaxHp;
    this.spawnInterval = CONFIG.enemy.spawnInterval * this.difficulty.spawnIntervalMul;
    this.spawnIntervalBase = this.spawnInterval;
    this.spawnAccelBase =
      Math.pow(CONFIG.enemy.spawnAccel, 1 / Math.max(0.01, this.difficulty.spawnAccelMul));
    this.enemySpeedBase = CONFIG.enemy.baseSpeed * this.difficulty.enemySpeedMul;
    this.enemySpeedPerWaveBase =
      CONFIG.enemy.speedPerWave * this.difficulty.enemySpeedMul;
    this.playerInvuln = 0;
    this.arrowsFired = 0;
    this.arrowsHit = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.arrows = [];
    this.enemies = [];
    this.particles = [];
    this.popups = [];
    this.spawnTimer = 0;
    this.shake = 0;
    this.hitStop = 0;
    this.isNewBest = false;
    this.lastResult = null;
    this.player = { x: this.width / 2, y: this.height / 2 };
    this.startNextWave();
  }

  startNextWave() {
    this.wave += 1;
    this.inWaveBreak = false;
    this.waveTimer = CONFIG.wave.duration;
    this.showWaveBanner = 2.0;
    this.waveBannerText = `WAVE ${this.wave}`;
    sfx.wave();
    this.events.onWaveStart(this.wave);
  }

  togglePause() {
    if (this.state === "playing") this.state = "paused";
    else if (this.state === "paused") this.state = "playing";
  }

  setPaused(p: boolean) {
    if (this.state === "playing" && p) this.state = "paused";
    else if (this.state === "paused" && !p) this.state = "playing";
  }

  toMenu() {
    this.state = "menu";
  }

  setDifficulty(d: Difficulty) {
    this.difficulty = DIFFICULTIES[d];
    if (this.state !== "playing") {
      this.playerMaxHp = this.difficulty.playerHp;
      // Update the playerHp in case they're on the menu screen and HP is shown elsewhere
    }
  }

  gameOver() {
    if (this.state !== "playing") return;
    this.state = "gameover";
    this.lastResult = { score: this.score, wave: this.wave };
    sfx.damage();
    // Big death burst
    this.spawnExplosion(this.player, 90, 200 + Math.random() * 60);
    // Secondary delayed rings
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        pos: { x: this.player.x, y: this.player.y },
        vel: { x: 0, y: 0 },
        life: 0.7 + i * 0.15,
        maxLife: 0.7 + i * 0.15,
        size: 8,
        hue: 280 + i * 30,
        kind: "ring",
        rotation: 0,
        rotationSpeed: 0,
      });
    }
    this.shake = CONFIG.screenShake.max;
    this.events.onGameOver(this.score, this.wave);
  }

  getStats(): EngineStats {
    return {
      fps: this.fps,
      state: this.state,
      score: this.score,
      wave: this.wave,
      waveTimer: this.waveTimer,
      hp: this.playerHp,
      maxHp: this.playerMaxHp,
      arrows: this.arrowsFired,
      hits: this.arrowsHit,
      combo: this.combo,
      comboTimer: this.comboTimer,
      shake: this.shake,
      hitStop: this.hitStop,
      accuracy:
        this.arrowsFired === 0
          ? 0
          : Math.round((this.arrowsHit / this.arrowsFired) * 100),
      paused: this.state === "paused",
      width: this.width,
      height: this.height,
      playerPos: this.player,
      aimAngle: this.aimAngle,
      showWaveBanner: this.showWaveBanner,
      waveBannerText: this.waveBannerText,
      isNewBest: this.isNewBest,
      lastResult: this.lastResult,
      difficulty: this.difficulty.key,
      difficultyLabel: this.difficulty.label,
      scoreMul: this.difficulty.scoreMul,
    };
  }

  // ---- Update ----
  update(input: InputState, dt: number) {
    if (this.state !== "playing") {
      // tick particles even in menu/gameover for visual flair
      this.updateParticles(dt);
      this.updatePopups(dt);
      this.shake = Math.max(0, this.shake - dt * CONFIG.screenShake.decay);
      this.showWaveBanner = Math.max(0, this.showWaveBanner - dt);
      this.updateFps(dt);
      return;
    }

    // hit-stop (freeze gameplay briefly for impact)
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      this.updateParticles(dt);
      this.updatePopups(dt);
      this.updateFps(dt);
      return;
    }

    this.updatePlayer(input, dt);
    this.updateArrows(dt);
    this.updateEnemies(dt);
    this.handleCollisions();
    this.updateSpawning(dt);
    this.updateWave(dt);
    this.updateParticles(dt);
    this.updatePopups(dt);
    this.updateFps(dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) this.combo = 0;
    this.showWaveBanner = Math.max(0, this.showWaveBanner - dt);
    this.playerInvuln = Math.max(0, this.playerInvuln - dt);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.shake = Math.max(0, this.shake - dt * CONFIG.screenShake.decay);
  }

  private updateFps(dt: number) {
    this.fpsTimer += dt;
    this.fpsFrames += 1;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTimer);
      this.fpsTimer = 0;
      this.fpsFrames = 0;
    }
  }

  private updatePlayer(input: InputState, dt: number) {
    // Movement comes from either touch joystick (input.moveX/moveY) or keyboard.
    let mx = input.moveX || 0;
    let my = input.moveY || 0;
    const k = (window as any).__arrowstorm_keys || {};
    if (k["a"] || k["arrowleft"]) mx -= 1;
    if (k["d"] || k["arrowright"]) mx += 1;
    if (k["w"] || k["arrowup"]) my -= 1;
    if (k["s"] || k["arrowdown"]) my += 1;
    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len;
      my /= len;
      this.player.x += mx * CONFIG.player.speed * dt;
      this.player.y += my * CONFIG.player.speed * dt;
    }

    // clamp to playfield
    const m = 18;
    this.player.x = Math.max(m, Math.min(this.width - m, this.player.x));
    this.player.y = Math.max(m, Math.min(this.height - m, this.player.y));

    // aim: explicit input → mouse position → nearest enemy → previous angle
    let ax = input.aimX;
    let ay = input.aimY;
    if (ax === 0 && ay === 0) {
      if (input.mouseX !== undefined && input.mouseY !== undefined) {
        ax = input.mouseX - this.player.x;
        ay = input.mouseY - this.player.y;
      } else if (this.enemies.length > 0) {
        // lock onto nearest enemy for that instant "fun in first 10s" feel
        let best = this.enemies[0];
        let bd = Infinity;
        for (const e of this.enemies) {
          const dx = e.pos.x - this.player.x;
          const dy = e.pos.y - this.player.y;
          const d = dx * dx + dy * dy;
          if (d < bd) {
            bd = d;
            best = e;
          }
        }
        ax = best.pos.x - this.player.x;
        ay = best.pos.y - this.player.y;
      }
    }
    if (ax !== 0 || ay !== 0) {
      this.aimAngle = Math.atan2(ay, ax);
    }

    // shoot
    if (input.shoot && this.fireCooldown <= 0) {
      this.shootArrow();
    }
  }

  private shootArrow() {
    const a = this.aimAngle;
    const sp = CONFIG.arrow.speed;
    const arr: Arrow = {
      id: id(),
      pos: {
        x: this.player.x + Math.cos(a) * (this.playerRadius + 6),
        y: this.player.y + Math.sin(a) * (this.playerRadius + 6),
      },
      vel: { x: Math.cos(a) * sp, y: Math.sin(a) * sp },
      life: CONFIG.arrow.life,
      trail: [],
      hue: 48,
    };
    this.arrows.push(arr);
    this.arrowsFired += 1;
    this.fireCooldown = CONFIG.arrow.fireRate;
    sfx.shoot();
    this.spawnMuzzleFlash(arr.pos, a);
    this.events.onShoot();
    // small recoil shake
    this.shake = Math.min(CONFIG.screenShake.max, this.shake + 2);
  }

  private updateArrows(dt: number) {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.trail.push({ x: a.pos.x, y: a.pos.y });
      if (a.trail.length > 8) a.trail.shift();
      a.pos.x += a.vel.x * dt;
      a.pos.y += a.vel.y * dt;
      a.life -= dt;
      if (
        a.life <= 0 ||
        a.pos.x < -20 ||
        a.pos.x > this.width + 20 ||
        a.pos.y < -20 ||
        a.pos.y > this.height + 20
      ) {
        this.arrows.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number) {
    const px = this.player.x;
    const py = this.player.y;
    const baseSpeed =
      this.enemySpeedBase + (this.wave - 1) * this.enemySpeedPerWaveBase;
    for (const e of this.enemies) {
      const dx = px - e.pos.x;
      const dy = py - e.pos.y;
      const dist = Math.max(0.0001, Math.hypot(dx, dy));
      const speed =
        baseSpeed *
        (e.kind === "speedy" ? 1.5 : e.kind === "tank" ? 0.65 : 1);
      e.vel.x = (dx / dist) * speed;
      e.vel.y = (dy / dist) * speed;
      e.pos.x += e.vel.x * dt;
      e.pos.y += e.vel.y * dt;
      e.phase += dt * 6;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
    }
  }

  private handleCollisions() {
    // arrows vs enemies
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      let consumed = false;
      for (let j = 0; j < this.enemies.length; j++) {
        const e = this.enemies[j];
        const dx = a.pos.x - e.pos.x;
        const dy = a.pos.y - e.pos.y;
        const r = CONFIG.arrow.radius + e.radius;
        if (dx * dx + dy * dy < r * r) {
          // hit!
          e.hp -= CONFIG.arrow.damage;
          e.hitFlash = 0.12;
          this.arrowsHit += 1;
          this.spawnHitBurst(a.pos, e.hue);
          sfx.hit();
          this.shake = Math.min(CONFIG.screenShake.max, this.shake + 1.5);
          this.addShakeMini();
          consumed = true;
          if (e.hp <= 0) {
            this.killEnemy(j);
          }
          break;
        }
      }
      if (consumed) this.arrows.splice(i, 1);
    }

    // enemies vs player
    if (this.playerInvuln <= 0) {
      for (let j = 0; j < this.enemies.length; j++) {
        const e = this.enemies[j];
        const dx = e.pos.x - this.player.x;
        const dy = e.pos.y - this.player.y;
        const r = this.playerRadius + e.radius * 0.8;
        if (dx * dx + dy * dy < r * r) {
          this.damagePlayer();
          // knock enemy back / destroy it for breathing room
          this.enemies.splice(j, 1);
          break;
        }
      }
    }
  }

  private damagePlayer() {
    // Difficulty-scaled damage (minimum 1)
    const dmg = Math.max(
      1,
      Math.round(CONFIG.enemy.contactDamage * this.difficulty.enemyDamageMul),
    );
    this.playerHp -= dmg;
    this.playerInvuln = CONFIG.player.invulnAfterHit;
    this.shake = CONFIG.screenShake.max * 0.9;
    this.hitStop = CONFIG.hitStop.duration;
    sfx.damage();
    this.spawnExplosion(this.player, 26, 0);
    this.events.onDamage();
    if (this.playerHp <= 0) {
      this.gameOver();
    }
  }

  private killEnemy(index: number) {
    const e = this.enemies[index];
    this.enemies.splice(index, 1);
    sfx.kill();
    this.spawnExplosion(e.pos, 22, e.hue);
    this.popups.push({
      id: id(),
      pos: { x: e.pos.x, y: e.pos.y - 10 },
      text: `+${this.scoreFor(e)}`,
      hue: 55,
      life: 0.9,
    });
    this.combo += 1;
    this.comboTimer = 1.4;
    const gained = this.scoreFor(e);
    this.score += gained;
    this.events.onKill(e.pos, gained);

    // splitter behavior — children inherit parent's HP, scaled by difficulty
    if (e.kind === "splitter" && (e.splitCount ?? 0) < 2) {
      const childHp = Math.max(
        1,
        Math.round(e.maxHp * 0.5 * this.difficulty.enemyHpMul),
      );
      for (let k = 0; k < CONFIG.enemy.splitterSplits; k++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 60;
        this.enemies.push({
          id: id(),
          pos: { x: e.pos.x, y: e.pos.y },
          vel: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
          radius: e.radius * 0.65,
          hp: childHp,
          maxHp: childHp,
          hue: e.hue,
          spawnTime: 0,
          phase: Math.random() * Math.PI * 2,
          kind: "grunt",
          splitCount: (e.splitCount ?? 0) + 1,
          hitFlash: 0,
        });
      }
    }
  }

  private scoreFor(e: Enemy): number {
    const base = e.kind === "tank" ? 25 : e.kind === "speedy" ? 15 : e.kind === "splitter" ? 30 : 10;
    const comboBonus = Math.floor(this.combo * 1.5);
    return Math.round((base + comboBonus) * this.difficulty.scoreMul);
  }

  private updateSpawning(dt: number) {
    if (this.inWaveBreak) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnInterval = Math.max(
        CONFIG.enemy.spawnIntervalMin,
        this.spawnInterval * this.spawnAccelBase,
      );
      this.spawnTimer = this.spawnInterval;
    }
  }

  private spawnEnemy() {
    // pick edge
    const w = this.width;
    const h = this.height;
    const side = Math.floor(Math.random() * 4);
    let x = 0,
      y = 0;
    const margin = 30;
    if (side === 0) {
      x = margin;
      y = Math.random() * h;
    } else if (side === 1) {
      x = w - margin;
      y = Math.random() * h;
    } else if (side === 2) {
      x = Math.random() * w;
      y = margin;
    } else {
      x = Math.random() * w;
      y = h - margin;
    }

    // decide kind by wave
    const r = Math.random();
    let kind: Enemy["kind"] = "grunt";
    let radius = CONFIG.enemy.radius;
    let hp = 1;
    let hue = 330;
    if (this.wave >= 2 && r < 0.18) {
      kind = "speedy";
      radius = 16;
      hp = 1;
      hue = 50;
    } else if (this.wave >= 2 && r < 0.32) {
      kind = "tank";
      radius = 30;
      hp = 3;
      hue = 280;
    } else if (this.wave >= 3 && r < 0.42) {
      kind = "splitter";
      radius = 24;
      hp = 2;
      hue = 160;
    }
    // Apply difficulty HP scaling (round up to at least 1)
    const scaledHp = Math.max(1, Math.round(hp * this.difficulty.enemyHpMul));
    hp = scaledHp;
    this.enemies.push({
      id: id(),
      pos: { x, y },
      vel: { x: 0, y: 0 },
      radius,
      hp,
      maxHp: hp,
      hue,
      spawnTime: 0.25,
      phase: Math.random() * Math.PI * 2,
      kind,
      splitCount: 0,
      hitFlash: 0,
    });
  }

  private updateWave(dt: number) {
    if (this.inWaveBreak) {
      this.waveBreakTimer -= dt;
      if (this.waveBreakTimer <= 0) {
        this.startNextWave();
      }
      return;
    }
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.inWaveBreak = true;
      this.waveBreakTimer = CONFIG.wave.breakDuration;
      this.showWaveBanner = 2.0;
      this.waveBannerText = `WAVE ${this.wave} CLEAR`;
      sfx.wave();
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      if (p.gravity) p.vel.y += p.gravity * dt;
      p.vel.x *= 0.96;
      p.vel.y *= 0.96;
      p.rotation += p.rotationSpeed * dt;
    }
  }

  private updatePopups(dt: number) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt;
      p.pos.y -= 28 * dt;
      if (p.life <= 0) this.popups.splice(i, 1);
    }
  }

  private spawnExplosion(pos: Vec2, count: number, hue: number) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 220;
      this.particles.push({
        pos: { x: pos.x, y: pos.y },
        vel: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
        life: 0.45 + Math.random() * 0.45,
        maxLife: 0.9,
        size: 2 + Math.random() * 3.5,
        hue: hue + (Math.random() * 30 - 15),
        kind: "spark",
        rotation: 0,
        rotationSpeed: Math.random() * 8 - 4,
        gravity: 80,
      });
    }
    // ring
    this.particles.push({
      pos: { x: pos.x, y: pos.y },
      vel: { x: 0, y: 0 },
      life: 0.45,
      maxLife: 0.45,
      size: 6,
      hue: hue,
      kind: "ring",
      rotation: 0,
      rotationSpeed: 0,
    });
  }

  private spawnMuzzleFlash(pos: Vec2, ang: number) {
    for (let i = 0; i < 6; i++) {
      const a = ang + (Math.random() - 0.5) * 0.6;
      const sp = 80 + Math.random() * 160;
      this.particles.push({
        pos: { x: pos.x, y: pos.y },
        vel: { x: Math.cos(a) * sp, y: Math.sin(a) * sp },
        life: 0.18,
        maxLife: 0.2,
        size: 2 + Math.random() * 2,
        hue: 50,
        kind: "glow",
        rotation: 0,
        rotationSpeed: 0,
      });
    }
  }

  private spawnHitBurst(pos: Vec2, hue: number) {
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 200;
      this.particles.push({
        pos: { x: pos.x, y: pos.y },
        vel: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
        life: 0.3 + Math.random() * 0.25,
        maxLife: 0.55,
        size: 1.5 + Math.random() * 2.5,
        hue: hue,
        kind: "shard",
        rotation: 0,
        rotationSpeed: Math.random() * 12 - 6,
        gravity: 40,
      });
    }
  }

  private addShakeMini() {
    if (this.shake < 4) this.shake = 4;
  }
}
