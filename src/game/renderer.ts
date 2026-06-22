import type { Engine } from "./engine";
import { CONFIG } from "./config";

export class Renderer {
  ctx: CanvasRenderingContext2D;
  dpr = 1;
  width = 0;
  height = 0;
  time = 0;

  constructor(public canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("No 2D context");
    this.ctx = ctx;
  }

  resize(w: number, h: number, dpr: number) {
    this.dpr = dpr;
    this.width = w;
    this.height = h;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(engine: Engine, dt: number) {
    this.time += dt;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // screen shake
    const shake = engine.shake;
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;

    ctx.save();
    ctx.translate(sx, sy);

    // background gradient
    const t = this.time * 0.05;
    const hue1 = (CONFIG.visuals.bgHue1 + Math.sin(t) * 6) | 0;
    const hue2 = (CONFIG.visuals.bgHue2 + Math.cos(t * 0.8) * 8) | 0;
    const g = ctx.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, Math.max(w, h));
    g.addColorStop(0, `hsl(${hue1}, 70%, 14%)`);
    g.addColorStop(0.6, `hsl(${(hue1 + hue2) / 2}, 60%, 8%)`);
    g.addColorStop(1, `hsl(${hue2}, 70%, 4%)`);
    ctx.fillStyle = g;
    ctx.fillRect(-50, -50, w + 100, h + 100);

    // moving starfield
    this.drawStars(engine);

    // vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = vg;
    ctx.fillRect(-50, -50, w + 100, h + 100);

    // ground ring / arena
    this.drawArena(engine);

    // Demo arrows in menu state to hint gameplay
    if (engine.state === "menu") this.drawDemoArrows(engine);

    // arrows (under enemies for nicer explosion overlap)
    this.drawArrows(engine);
    // enemies
    this.drawEnemies(engine);
    // player
    this.drawPlayer(engine);
    // particles
    this.drawParticles(engine);
    // popups
    this.drawPopups(engine);

    ctx.restore();

    // overlays drawn without shake
    this.drawOverlays(engine);
  }

  private drawDemoArrows(_engine: Engine) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    // 3 demo arrows orbiting in a slow pattern
    const count = 3;
    for (let i = 0; i < count; i++) {
      const phase = this.time * 0.6 + (i / count) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.28;
      const ax = cx + Math.cos(phase) * radius;
      const ay = cy + Math.sin(phase) * radius * 0.55;
      const tang = phase + Math.PI / 2;
      const speed = 140;
      // simulate a moving arrow
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(tang);
      const len = 14;
      const wid = 4;
      const grd = ctx.createLinearGradient(-len, 0, len, 0);
      grd.addColorStop(0, `hsla(48, 95%, 65%, 0.0)`);
      grd.addColorStop(1, `hsla(48, 95%, 70%, 0.8)`);
      ctx.fillStyle = grd;
      ctx.strokeStyle = `hsl(48, 100%, 88%)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(len, 0);
      ctx.lineTo(-len * 0.4, wid);
      ctx.lineTo(-len * 0.7, 0);
      ctx.lineTo(-len * 0.4, -wid);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // subtle moving point for velocity (unused but keeps the look alive)
      void speed;
    }
  }

  private drawStars(engine: Engine) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    for (const s of engine.stars) {
      // gentle drift
      s.x += 4 * s.z * (1 / 60);
      s.y += 2 * s.z * (1 / 60);
      if (s.x > w) s.x -= w;
      if (s.y > h) s.y -= h;
      const a = 0.4 + Math.sin(this.time * 2 + s.x * 0.01) * 0.2;
      ctx.fillStyle = `hsla(${s.hue}, 80%, 80%, ${a * s.z})`;
      ctx.fillRect(s.x, s.y, 1.4 * s.z, 1.4 * s.z);
    }
  }

  private drawArena(engine: Engine) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.time * 0.1);
    ctx.strokeStyle = `hsla(${CONFIG.visuals.bgHue1}, 80%, 60%, 0.18)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI * 2;
      const a1 = ((i + 1) / 6) * Math.PI * 2;
      ctx.moveTo(Math.cos(a0) * r, Math.sin(a0) * r);
      ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = `hsla(${CONFIG.visuals.bgHue1}, 80%, 70%, 0.12)`;
    ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // pulse on wave banner
    if (engine.showWaveBanner > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      const pulse = 1 + Math.sin(this.time * 8) * 0.04;
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = `hsla(${CONFIG.visuals.bgHue1}, 90%, 70%, ${0.25 * engine.showWaveBanner})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawArrows(engine: Engine) {
    const ctx = this.ctx;
    for (const a of engine.arrows) {
      // trail
      ctx.lineCap = "round";
      for (let i = 0; i < a.trail.length - 1; i++) {
        const p0 = a.trail[i];
        const p1 = a.trail[i + 1];
        const t = i / a.trail.length;
        ctx.strokeStyle = `hsla(${a.hue}, 95%, 65%, ${t * 0.7})`;
        ctx.lineWidth = 1 + t * 3;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      // arrow body (triangle)
      const ang = Math.atan2(a.vel.y, a.vel.x);
      const len = 16;
      const wid = 5;
      ctx.save();
      ctx.translate(a.pos.x, a.pos.y);
      ctx.rotate(ang);
      const grd = ctx.createLinearGradient(-len, 0, len, 0);
      grd.addColorStop(0, `hsla(${a.hue}, 95%, 65%, 0.2)`);
      grd.addColorStop(1, `hsla(${a.hue}, 95%, 70%, 1)`);
      ctx.fillStyle = grd;
      ctx.strokeStyle = `hsl(${a.hue}, 100%, 88%)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(len, 0);
      ctx.lineTo(-len * 0.4, wid);
      ctx.lineTo(-len * 0.7, 0);
      ctx.lineTo(-len * 0.4, -wid);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // glow
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `hsla(${a.hue}, 100%, 70%, 0.45)`;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawEnemies(engine: Engine) {
    const ctx = this.ctx;
    for (const e of engine.enemies) {
      const spawn = Math.min(1, 1 - e.spawnTime / 0.25);
      const wob = Math.sin(e.phase) * 1.6;
      const r = e.radius * spawn;
      ctx.save();
      ctx.translate(e.pos.x, e.pos.y + wob);
      // body
      const hue = e.hitFlash > 0 ? 60 : e.hue;
      const grd = ctx.createRadialGradient(0, -r * 0.4, 1, 0, 0, r);
      grd.addColorStop(0, `hsl(${hue}, 95%, 70%)`);
      grd.addColorStop(0.6, `hsl(${hue}, 80%, 45%)`);
      grd.addColorStop(1, `hsl(${hue}, 80%, 25%)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      if (e.kind === "speedy") {
        // diamond
        ctx.moveTo(0, -r);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        ctx.closePath();
      } else if (e.kind === "tank") {
        // hex
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else if (e.kind === "splitter") {
        // triangle
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 100%, 90%, 0.9)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // eye / inner glow
      ctx.fillStyle = `hsl(${(hue + 180) % 360}, 100%, 92%)`;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.5, r * 0.18), 0, Math.PI * 2);
      ctx.fill();

      // hp bar
      if (e.maxHp > 1) {
        const w = r * 1.6;
        const h2 = 4;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(-w / 2, -r - 10, w, h2);
        ctx.fillStyle = `hsl(${hue}, 95%, 60%)`;
        ctx.fillRect(-w / 2, -r - 10, w * (e.hp / e.maxHp), h2);
      }

      ctx.restore();
    }
  }

  private drawPlayer(engine: Engine) {
    const ctx = this.ctx;
    const p = engine.player;
    const r = engine.playerRadius;
    const ang = engine.aimAngle;

    ctx.save();
    ctx.translate(p.x, p.y);

    // soft ground shadow
    ctx.save();
    ctx.translate(0, r * 0.85);
    ctx.scale(1 + Math.sin(this.time * 3) * 0.04, 0.45);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // outer halo
    ctx.globalCompositeOperation = "lighter";
    const grd = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.6);
    grd.addColorStop(0, "rgba(140,200,255,0.55)");
    grd.addColorStop(0.5, "rgba(180,140,255,0.18)");
    grd.addColorStop(1, "rgba(140,200,255,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // invuln shimmer ring
    if (engine.playerInvuln > 0) {
      const a = engine.playerInvuln / CONFIG.player.invulnAfterHit;
      ctx.strokeStyle = `hsla(${200 + a * 80}, 95%, 70%, ${a * 0.9})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 5 + Math.sin(this.time * 20) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // body (gradient orb)
    const bodyGrd = ctx.createRadialGradient(0, -r * 0.35, 1, 0, 0, r);
    bodyGrd.addColorStop(0, "hsl(200, 100%, 88%)");
    bodyGrd.addColorStop(0.5, "hsl(210, 95%, 65%)");
    bodyGrd.addColorStop(1, "hsl(240, 85%, 35%)");
    ctx.fillStyle = bodyGrd;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // eye / gem
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(r * 0.55, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "hsl(220, 100%, 25%)";
    ctx.beginPath();
    ctx.arc(r * 0.6, 0, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // bow (rotated to aim)
    ctx.save();
    ctx.rotate(ang);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(r * 0.5, -r * 0.85);
    ctx.quadraticCurveTo(r * 1.65, 0, r * 0.5, r * 0.85);
    ctx.stroke();
    // string
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.2;
    const pull = engine.fireCooldown > CONFIG.arrow.fireRate * 0.5 ? 0 : 3;
    ctx.beginPath();
    ctx.moveTo(r * 0.5, -r * 0.85);
    ctx.lineTo(r * 0.5 + pull, 0);
    ctx.lineTo(r * 0.5, r * 0.85);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Aim preview line (subtle, in world space)
    if (engine.state === "playing" && engine.playerInvuln <= 0) {
      const cx = Math.cos(ang);
      const cy = Math.sin(ang);
      const len = Math.min(engine.width, engine.height) * 0.22;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const lg = ctx.createLinearGradient(
        p.x + cx * r,
        p.y + cy * r,
        p.x + cx * (r + len),
        p.y + cy * (r + len),
      );
      lg.addColorStop(0, "rgba(255,230,150,0.7)");
      lg.addColorStop(1, "rgba(255,230,150,0)");
      ctx.strokeStyle = lg;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -this.time * 30;
      ctx.beginPath();
      ctx.moveTo(p.x + cx * r, p.y + cy * r);
      ctx.lineTo(p.x + cx * (r + len), p.y + cy * (r + len));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  private drawParticles(engine: Engine) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = "lighter";
    for (const p of engine.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      if (p.kind === "ring") {
        ctx.strokeStyle = `hsla(${p.hue}, 100%, 70%, ${a})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const grow = (1 - a) * 60;
        ctx.arc(p.pos.x, p.pos.y, 6 + grow, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "shard") {
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${a})`;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
        ctx.restore();
      } else {
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${a})`;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  private drawPopups(engine: Engine) {
    const ctx = this.ctx;
    for (const p of engine.popups) {
      const a = Math.min(1, p.life / 0.9);
      ctx.save();
      ctx.translate(p.pos.x, p.pos.y);
      ctx.scale(0.6 + (1 - a) * 1.2, 0.6 + (1 - a) * 1.2);
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `hsla(${p.hue}, 100%, 85%, ${a})`;
      ctx.strokeStyle = `hsla(${p.hue}, 100%, 30%, ${a * 0.8})`;
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, 0, 0);
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
  }

  private drawOverlays(engine: Engine) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // top hud: hp, score, wave, combo
    if (engine.state === "playing" || engine.state === "paused") {
      this.drawHUD(engine);
    }

    // wave banner
    if (engine.showWaveBanner > 0) {
      const a = Math.min(1, engine.showWaveBanner / 2.0);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(w / 2, h * 0.28);
      const scale = 1.2 - a * 0.2;
      ctx.scale(scale, scale);
      ctx.font = "bold 64px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `hsla(${CONFIG.visuals.bgHue1}, 100%, 80%, 1)`;
      ctx.shadowColor = `hsla(${CONFIG.visuals.bgHue1}, 100%, 50%, 0.7)`;
      ctx.shadowBlur = 24;
      ctx.fillText(engine.waveBannerText, 0, 0);
      ctx.restore();
    }

    // paused overlay
    if (engine.state === "paused") {
      this.drawScrim(w, h, 0.6);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 56px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUSED", w / 2, h / 2 - 10);
      ctx.font = "20px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("Tap or press P / Esc to resume", w / 2, h / 2 + 36);
    }
  }

  private drawHUD(engine: Engine) {
    const ctx = this.ctx;
    const w = this.width;
    const pad = 18;
    const top = 18;

    // top bar
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    this.roundedRect(8, top, w - 16, 56, 14);
    ctx.fill();

    // score
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillText("SCORE", pad + 16, top + 18);
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,220,120,1)";
    ctx.fillText(engine.score.toLocaleString(), pad + 16, top + 42);

    // wave
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`WAVE ${engine.wave}`, w / 2, top + 14);
    // wave timer bar
    const barW = 140;
    const barH = 6;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(w / 2 - barW / 2, top + 24, barW, barH);
    ctx.fillStyle = "rgba(180,220,255,0.95)";
    const tw = engine.inWaveBreak
      ? 1 - engine.waveBreakTimer / 2.5
      : engine.waveTimer / CONFIG.wave.duration;
    ctx.fillRect(w / 2 - barW / 2, top + 24, barW * Math.max(0, Math.min(1, tw)), barH);
    // break label
    if (engine.inWaveBreak) {
      ctx.fillStyle = "rgba(255,200,120,0.95)";
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText("Next wave incoming…", w / 2, top + 44);
    }

    // hp
    const hpW = 130;
    const hpX = w - pad - 16 - hpW;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("HEALTH", w - pad - 16, top + 14);
    for (let i = 0; i < engine.playerMaxHp; i++) {
      const x = hpX + (hpW - 18 * engine.playerMaxHp) / 2 + i * 18;
      const y = top + 30;
      if (i < engine.playerHp) {
        const grd = ctx.createRadialGradient(x + 7, y + 7, 1, x + 7, y + 7, 14);
        grd.addColorStop(0, "rgba(255,180,200,1)");
        grd.addColorStop(1, "rgba(220,60,120,0.95)");
        ctx.fillStyle = grd;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
      }
      ctx.beginPath();
      // heart
      ctx.moveTo(x + 8, y + 4);
      ctx.bezierCurveTo(x + 14, y - 2, x + 18, y + 4, x + 8, y + 12);
      ctx.bezierCurveTo(x - 2, y + 4, x + 2, y - 2, x + 8, y + 4);
      ctx.fill();
    }

    // combo
    if (engine.combo > 1) {
      const c = engine.combo;
      ctx.font = "bold 24px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = `hsla(${(c * 30) % 360}, 100%, 70%, ${Math.min(1, engine.comboTimer)})`;
      ctx.shadowColor = `hsla(${(c * 30) % 360}, 100%, 50%, 0.6)`;
      ctx.shadowBlur = 14;
      ctx.fillText(`× ${c}`, w / 2, top + 76);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  private drawScrim(w: number, h: number, a: number) {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(2,2,12,${a})`;
    ctx.fillRect(0, 0, w, h);
  }

  private roundedRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
}
