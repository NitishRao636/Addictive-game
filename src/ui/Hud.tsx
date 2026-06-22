import type { EngineStats } from "../game/engine";

type Props = {
  state: EngineStats | undefined;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onHelp: () => void;
};

export function Hud({ state, muted, onToggleMute, onPause, onRestart, onHelp }: Props) {
  if (!state) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Top-left tiny meta + difficulty badge */}
      <div className="pointer-events-auto absolute left-3 top-3 hidden gap-2 sm:flex">
        <button
          onClick={onHelp}
          className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/70 backdrop-blur hover:bg-black/55"
          aria-label="How to play"
        >
          ?
        </button>
        <span
          className={
            "rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest backdrop-blur " +
            diffBadgeClass(state.difficulty)
          }
        >
          {state.difficultyLabel}
        </span>
      </div>

      {/* Top-right controls */}
      <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-1.5">
        <IconButton title="Restart" onClick={onRestart}>
          <RestartIcon />
        </IconButton>
        <IconButton title="Pause (P)" onClick={onPause}>
          <PauseIcon />
        </IconButton>
        <IconButton title="Sound (M)" onClick={onToggleMute}>
          {muted ? <SoundOffIcon /> : <SoundOnIcon />}
        </IconButton>
      </div>

      {/* Bottom-left fps small */}
      {state.fps > 0 && state.fps < 55 && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-mono text-rose-200/90">
          {state.fps} fps
        </div>
      )}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/35 text-white/80 backdrop-blur transition-all hover:bg-black/55 hover:text-white active:scale-90"
    >
      {children}
    </button>
  );
}

function diffBadgeClass(d: string): string {
  if (d === "easy")
    return "border-emerald-300/40 bg-emerald-400/15 text-emerald-200";
  if (d === "hard")
    return "border-rose-300/40 bg-rose-400/15 text-rose-200";
  return "border-amber-300/40 bg-amber-400/15 text-amber-200";
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}
function SoundOnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9v6h4l5 4V5L9 9H5z" />
      <path d="M16 8a5 5 0 0 1 0 8" />
    </svg>
  );
}
function SoundOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9v6h4l5 4V5L9 9H5z" />
      <path d="M16 9l5 5m0-5l-5 5" />
    </svg>
  );
}
