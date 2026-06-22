import type { HighScoreEntry } from "../game/types";
import type { Difficulty } from "../game/difficulty";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../game/difficulty";

type Props = {
  onStart: () => void;
  highScores: HighScoreEntry[];
  muted: boolean;
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onToggleMute: () => void;
  onHelp: () => void;
};

export function StartScreen({
  onStart,
  highScores,
  muted,
  difficulty,
  onChangeDifficulty,
  onToggleMute,
  onHelp,
}: Props) {
  const top = highScores.slice(0, 5);
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0220]/85 via-[#0a0220]/70 to-[#0a0220]/95 backdrop-blur-[2px]" />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-5 sm:gap-7 sm:py-6">
        {/* Logo / Title */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg
              viewBox="0 0 220 80"
              className="h-14 w-auto drop-shadow-[0_0_24px_rgba(140,100,255,0.6)] sm:h-20"
              aria-hidden
            >
              <defs>
                <linearGradient id="lg" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#ffdf6e" />
                  <stop offset="50%" stopColor="#ff8bd6" />
                  <stop offset="100%" stopColor="#7ad7ff" />
                </linearGradient>
              </defs>
              <g>
                <text
                  x="110"
                  y="50"
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="900"
                  fontSize="42"
                  letterSpacing="3"
                  fill="url(#lg)"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                >
                  ARROWSTORM
                </text>
                <path
                  d="M40 64 L180 64"
                  stroke="url(#lg)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </g>
            </svg>
          </div>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.4em] text-white/55 sm:text-sm">
            Arrow Defense
          </p>
        </div>

        {/* Difficulty selector */}
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/55 sm:text-xs">
              Choose your challenge
            </h3>
            <span className="text-[10px] text-white/35 sm:text-xs">
              Score × {DIFFICULTIES[difficulty].scoreMul.toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {DIFFICULTY_ORDER.map((key) => {
              const d = DIFFICULTIES[key];
              const selected = key === difficulty;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChangeDifficulty(key)}
                  className={
                    "group relative flex flex-col items-start gap-1 overflow-hidden rounded-2xl border p-3 text-left transition-all active:scale-[0.97] sm:p-4 " +
                    (selected
                      ? `border-white/30 bg-gradient-to-br ${d.accent} text-white shadow-[0_8px_30px_-10px_rgba(255,120,200,0.5)] ring-2 ${d.ringClass}`
                      : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]")
                  }
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-base font-extrabold tracking-wide sm:text-lg">
                      {d.label}
                    </span>
                    {selected && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-white/30 text-[11px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <span
                    className={
                      "text-[10px] leading-tight sm:text-[11px] " +
                      (selected ? "text-white/85" : "text-white/55")
                    }
                  >
                    {d.tagline}
                  </span>
                  <div
                    className={
                      "mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] uppercase tracking-wider sm:text-[10px] " +
                      (selected ? "text-white/80" : "text-white/45")
                    }
                  >
                    <span>♥ {d.playerHp}</span>
                    <span>× {(d.enemySpeedMul).toFixed(2)} spd</span>
                    <span>× {(d.spawnIntervalMul).toFixed(2)} rate</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex w-full flex-col items-center gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-amber-300 via-pink-400 to-fuchsia-500 px-8 py-3.5 text-lg font-extrabold tracking-wide text-white shadow-[0_10px_40px_-10px_rgba(255,80,180,0.7)] ring-1 ring-white/30 transition-all hover:scale-[1.03] active:scale-95 sm:text-xl"
          >
            <PlayIcon />
            <span>START {DIFFICULTIES[difficulty].label.toUpperCase()}</span>
            <span className="hidden text-xs font-medium opacity-80 sm:inline">
              · ENTER
            </span>
          </button>
          <button
            onClick={onHelp}
            className="rounded-2xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85 backdrop-blur hover:bg-white/10"
          >
            How to play
          </button>
        </div>

        {/* Controls hint */}
        <div className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[11px] sm:grid-cols-4 sm:gap-3 sm:p-4 sm:text-sm">
          <Hint keyboard="Move" touch="Drag L" />
          <Hint keyboard="Aim" touch="Drag R" />
          <Hint keyboard="Fire" touch="Hold R" />
          <Hint keyboard="Pause" touch="Btn" />
        </div>

        {/* High score table */}
        <div className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/70 sm:text-xs">
              Local High Scores
            </h3>
            <span className="text-[10px] text-white/40">Top 5 · Saved locally</span>
          </div>
          {top.length === 0 ? (
            <p className="py-3 text-center text-sm text-white/50">
              No scores yet — be the first!
            </p>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-white/40 sm:text-xs">
                <tr>
                  <th className="py-1 pl-1">#</th>
                  <th className="py-1">Score</th>
                  <th className="py-1">Wave</th>
                  <th className="py-1">Acc</th>
                  <th className="py-1 pr-1 text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {top.map((e, i) => (
                  <tr
                    key={`${e.date}-${i}`}
                    className="border-t border-white/5 text-white/85"
                  >
                    <td className="py-1.5 pl-1 font-mono text-white/60">{i + 1}</td>
                    <td className="py-1.5 font-bold text-amber-200">
                      {e.score.toLocaleString()}
                    </td>
                    <td className="py-1.5">{e.wave}</td>
                    <td className="py-1.5">{e.accuracy}%</td>
                    <td className="py-1.5 pr-1 text-right text-[10px] text-white/50 sm:text-xs">
                      {formatDate(e.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-white/40">
          <button
            onClick={onToggleMute}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10"
          >
            {muted ? "🔇 Sound off" : "🔊 Sound on"}
          </button>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
            M to mute
          </span>
        </div>
      </div>
    </div>
  );
}

function Hint({ keyboard, touch }: { keyboard: string; touch: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5">
      <span className="text-white/70">{keyboard}</span>
      <span className="rounded-md border border-white/15 bg-black/40 px-1.5 py-0.5 text-[10px] font-mono text-white/85">
        {touch}
      </span>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}
