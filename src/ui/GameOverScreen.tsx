import type { HighScoreEntry } from "../game/types";
import type { Difficulty } from "../game/difficulty";
import { DIFFICULTIES } from "../game/difficulty";

type Props = {
  result: { score: number; wave: number; difficulty?: Difficulty } | null;
  isNewBest: boolean;
  highScores: HighScoreEntry[];
  onRestart: () => void;
  onMenu: () => void;
};

export function GameOverScreen({ result, isNewBest, highScores, onRestart, onMenu }: Props) {
  const score = result?.score ?? 0;
  const wave = result?.wave ?? 0;
  const difficulty: Difficulty = result?.difficulty ?? "medium";
  const diff = DIFFICULTIES[difficulty];
  const top = highScores.slice(0, 5);
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-[#1a0220]/80 to-black/90 backdrop-blur-md" />
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-5 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 text-center shadow-2xl sm:p-8">
        <div className="text-xs uppercase tracking-[0.4em] text-rose-200/80">Defeated</div>
        <h2 className="bg-gradient-to-br from-rose-300 via-fuchsia-400 to-violet-400 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
          Game Over
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span
            className={
              "rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest " +
              diffBadgeClass(difficulty)
            }
          >
            {diff.label}
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Score × {diff.scoreMul.toFixed(2)}
          </span>
        </div>

        {isNewBest && (
          <div className="rounded-full bg-amber-400/15 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-amber-200 ring-1 ring-amber-300/40">
            ✨ New Personal Best ✨
          </div>
        )}

        <div className="grid w-full grid-cols-2 gap-3">
          <Stat label="Final score" value={score.toLocaleString()} accent />
          <Stat label="Wave reached" value={String(wave)} />
        </div>

        <div className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-white/60">
            Top scores
          </h3>
          {top.length === 0 ? (
            <p className="text-white/40">No scores yet.</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {top.map((e, i) => {
                const isYou =
                  i === 0 &&
                  isNewBest &&
                  e.score === score &&
                  e.wave === wave;
                return (
                  <li
                    key={`${e.date}-${i}`}
                    className={
                      "flex items-center justify-between rounded-lg px-2 py-1.5 " +
                      (isYou ? "bg-amber-300/10 ring-1 ring-amber-300/40" : "")
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-right font-mono text-white/45">{i + 1}.</span>
                      <span className="font-bold text-amber-200">
                        {e.score.toLocaleString()}
                      </span>
                      <span className="text-white/50">· wave {e.wave}</span>
                      {isYou && (
                        <span className="rounded bg-amber-300/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-white/40">
                      {e.accuracy}% acc
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <button
            onClick={onRestart}
            className="flex-1 rounded-2xl bg-gradient-to-br from-amber-300 via-pink-400 to-fuchsia-500 px-5 py-3.5 text-base font-extrabold tracking-wide text-white shadow-[0_10px_30px_-10px_rgba(255,80,180,0.6)] transition-all hover:scale-[1.01] active:scale-95"
          >
            ↻ Play again
            <span className="ml-2 text-xs font-medium opacity-80">· R</span>
          </button>
          <button
            onClick={onMenu}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-base font-bold text-white/90 hover:bg-white/10"
          >
            ← Main menu
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={
        "rounded-2xl border p-3 text-left " +
        (accent
          ? "border-amber-300/40 bg-amber-300/10"
          : "border-white/10 bg-white/5")
      }
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">
        {label}
      </div>
      <div
        className={
          "mt-0.5 text-3xl font-black tracking-tight " +
          (accent ? "text-amber-200" : "text-white")
        }
      >
        {value}
      </div>
    </div>
  );
}

function diffBadgeClass(d: Difficulty): string {
  if (d === "easy")
    return "border-emerald-300/40 bg-emerald-400/15 text-emerald-200";
  if (d === "hard")
    return "border-rose-300/40 bg-rose-400/15 text-rose-200";
  return "border-amber-300/40 bg-amber-400/15 text-amber-200";
}
