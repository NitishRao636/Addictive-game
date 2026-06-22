import { useEffect, useMemo, useRef, useState } from "react";
import { Engine } from "./game/engine";
import { Renderer } from "./game/renderer";
import { setMuted, sfx, primeAudio } from "./game/audio";
import { loadHighScores, submitScore } from "./game/highscore";
import type { HighScoreEntry } from "./game/types";
import { loadDifficulty, saveDifficulty } from "./game/difficulty";
import type { Difficulty } from "./game/difficulty";
import { StartScreen } from "./ui/StartScreen";
import { PauseScreen } from "./ui/PauseScreen";
import { GameOverScreen } from "./ui/GameOverScreen";
import { Hud } from "./ui/Hud";
import { TouchControls } from "./ui/TouchControls";
import { HelpOverlay } from "./ui/HelpOverlay";

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const rafRef = useRef<number>(0);

  const [, force] = useState(0);
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() =>
    loadHighScores(),
  );
  const [muted, setMutedState] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [difficulty, setDifficultyState] = useState<Difficulty>(() => loadDifficulty());
  const lastResultRef = useRef<{ score: number; wave: number; difficulty: Difficulty } | null>(null);
  const isNewBestRef = useRef(false);

  // Build engine once
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine({
      onDamage: () => force((x) => x + 1),
      onKill: () => force((x) => x + 1),
      onShoot: () => {},
      onWaveStart: () => force((x) => x + 1),
      onGameOver: (score, wave) => {
        lastResultRef.current = {
          score,
          wave,
          difficulty: engine.difficulty.key,
        };
        const result = submitScore({
          score,
          wave,
          arrows: engine.arrowsFired,
          accuracy:
            engine.arrowsFired === 0
              ? 0
              : Math.round((engine.arrowsHit / engine.arrowsFired) * 100),
          date: new Date().toISOString(),
        });
        isNewBestRef.current = result.isNewBest;
        setHighScores(result.entries);
        force((x) => x + 1);
      },
    });
    engineRef.current = engine;
    rendererRef.current = new Renderer(canvasRef.current);

    // immediate resize so first frame has correct dimensions
    const container = containerRef.current;
    if (container) {
      const r = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rendererRef.current.resize(r.width, r.height, dpr);
      engine.resize(r.width, r.height);
    }

    // init state
    engine.state = "menu";
    force((x) => x + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize handling
  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current || !engineRef.current || !rendererRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rendererRef.current.resize(r.width, r.height, dpr);
      engineRef.current.resize(r.width, r.height);
    };
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Keyboard input + global keys
  useEffect(() => {
    const keys: Record<string, boolean> = ((window as any).__arrowstorm_keys =
      (window as any).__arrowstorm_keys || {});

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      // Pause / resume
      if (k === "p" || k === "escape") {
        const eng = engineRef.current;
        if (eng && (eng.state === "playing" || eng.state === "paused")) {
          eng.togglePause();
          sfxTap();
          force((x) => x + 1);
        }
      }
      // Restart on R during gameover
      if (k === "r") {
        const eng = engineRef.current;
        if (eng && eng.state === "gameover") {
          eng.startGame();
          isNewBestRef.current = false;
          sfxTap();
          force((x) => x + 1);
        }
      }
      // Mute
      if (k === "m") {
        setMutedState((m) => {
          const next = !m;
          setMuted(next);
          return next;
        });
      }
      // Enter/Space starts in menu
      if ((k === "enter" || k === " ") && engineRef.current?.state === "menu") {
        primeAudio();
        engineRef.current.setDifficulty(difficulty);
        engineRef.current.startGame();
        sfxTap();
        force((x) => x + 1);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys[k] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Mouse input for desktop (auto-aim at cursor)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const eng = engineRef.current;
      if (!eng || !canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      // store on engine via input shim
      (eng as any).mouseX = mx;
      (eng as any).mouseY = my;
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const eng = engineRef.current;
      if (eng?.state === "playing") {
        (eng as any).mouseDown = true;
      } else if (eng?.state === "menu") {
        // click to start (handled in TouchControls too)
      }
    };
    const onUp = () => {
      const eng = engineRef.current;
      if (eng) (eng as any).mouseDown = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const eng = engineRef.current;
      const rnd = rendererRef.current;
      if (eng && rnd) {
        const input = buildInput(eng);
        eng.update(input, dt);
        rnd.draw(eng, dt);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const start = () => {
    primeAudio();
    const eng = engineRef.current;
    if (!eng) return;
    eng.setDifficulty(difficulty);
    eng.startGame();
    isNewBestRef.current = false;
    lastResultRef.current = null;
    sfxTap();
    force((x) => x + 1);
  };

  const resume = () => {
    engineRef.current?.setPaused(false);
    sfxTap();
    force((x) => x + 1);
  };

  const restart = () => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.setDifficulty(difficulty);
    eng.startGame();
    isNewBestRef.current = false;
    lastResultRef.current = null;
    sfxTap();
    force((x) => x + 1);
  };

  const changeDifficulty = (d: Difficulty) => {
    setDifficultyState(d);
    saveDifficulty(d);
    engineRef.current?.setDifficulty(d);
    sfxTap();
    force((x) => x + 1);
  };

  const toMenu = () => {
    engineRef.current?.toMenu();
    sfxTap();
    force((x) => x + 1);
  };

  const state = engineRef.current?.state ?? "menu";

  // Touch handler
  const touchHandlers = useMemo(() => {
    return {
      onAim: (ax: number, ay: number, active: boolean) => {
        const eng = engineRef.current;
        if (!eng) return;
        (eng as any).touchAim = { x: ax, y: ay, active };
      },
      onFire: (firing: boolean) => {
        const eng = engineRef.current;
        if (!eng) return;
        (eng as any).touchFire = firing;
      },
      onMove: (mx: number, my: number, active: boolean) => {
        const eng = engineRef.current;
        if (!eng) return;
        (eng as any).touchMove = { x: mx, y: my, active };
      },
    };
  }, []);

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-black text-white select-none">
      <div
        ref={containerRef}
        className="absolute inset-0 touch-none overscroll-none"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          aria-label="Arrow game canvas"
        />
      </div>

      {/* HUD is rendered in canvas, but on top we add a thin DOM overlay for crisp text & controls */}
      {state === "playing" && (
        <>
          <Hud
            state={engineRef.current?.getStats()}
            muted={muted}
            onToggleMute={() => {
              setMutedState((m) => {
                const next = !m;
                setMuted(next);
                return next;
              });
            }}
            onPause={() => {
              engineRef.current?.togglePause();
              sfxTap();
              force((x) => x + 1);
            }}
            onRestart={() => {
              restart();
            }}
            onHelp={() => setShowHelp(true)}
          />
          <TouchControls handlers={touchHandlers} />
        </>
      )}

      {state === "paused" && (
        <PauseScreen
          onResume={resume}
          onRestart={restart}
          onMenu={toMenu}
          muted={muted}
          onToggleMute={() => {
            setMutedState((m) => {
              const next = !m;
              setMuted(next);
              return next;
            });
          }}
        />
      )}

      {state === "gameover" && (
        <GameOverScreen
          result={lastResultRef.current}
          isNewBest={isNewBestRef.current}
          highScores={highScores}
          onRestart={restart}
          onMenu={toMenu}
        />
      )}

      {state === "menu" && (
        <StartScreen
          onStart={start}
          highScores={highScores}
          muted={muted}
          difficulty={difficulty}
          onChangeDifficulty={changeDifficulty}
          onToggleMute={() => {
            setMutedState((m) => {
              const next = !m;
              setMuted(next);
              return next;
            });
          }}
          onHelp={() => setShowHelp(true)}
        />
      )}

      {showHelp && (
        <HelpOverlay onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

function sfxTap() {
  sfx.ui();
}

// Build input each frame
function buildInput(eng: Engine) {
  const axRaw = (eng as any).touchAim as
    | { x: number; y: number; active: boolean }
    | undefined;
  const mvRaw = (eng as any).touchMove as
    | { x: number; y: number; active: boolean }
    | undefined;
  const fireRaw = (eng as any).touchFire as boolean | undefined;
  const mouseX = (eng as any).mouseX as number | undefined;
  const mouseY = (eng as any).mouseY as number | undefined;
  const mouseDown = (eng as any).mouseDown as boolean | undefined;

  let aimX = 0;
  let aimY = 0;
  let pointerActive = false;
  let shoot = false;
  let moveX = 0;
  let moveY = 0;

  // touch aim overrides mouse
  if (axRaw && axRaw.active) {
    aimX = axRaw.x;
    aimY = axRaw.y;
    pointerActive = true;
  } else if (mouseX !== undefined && mouseY !== undefined) {
    aimX = mouseX - eng.player.x;
    aimY = mouseY - eng.player.y;
    pointerActive = true;
  }

  // touch movement
  if (mvRaw && mvRaw.active) {
    moveX = mvRaw.x;
    moveY = mvRaw.y;
  }

  // shoot: hold-to-fire (touch or mouse)
  if (fireRaw) shoot = true;
  else if (mouseDown) shoot = true;
  // Spacebar also fires
  const k = (window as any).__arrowstorm_keys || {};
  if (k[" "]) shoot = true;

  return {
    aimX,
    aimY,
    aimAngle: Math.atan2(aimY, aimX),
    moveX,
    moveY,
    shoot,
    pause: false,
    pointerActive,
    mouseX,
    mouseY,
  };
}
