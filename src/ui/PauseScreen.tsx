type Props = {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  muted: boolean;
  onToggleMute: () => void;
};

export function PauseScreen({ onResume, onRestart, onMenu, muted, onToggleMute }: Props) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 text-center shadow-2xl">
        <div className="text-xs uppercase tracking-[0.4em] text-white/50">Game</div>
        <h2 className="text-5xl font-black tracking-tight text-white">Paused</h2>
        <p className="text-sm text-white/55">
          Take a breath. The arrows will wait.
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <Button onClick={onResume} primary>
            ▶ Resume
          </Button>
          <Button onClick={onRestart}>↻ Restart</Button>
          <Button onClick={onMenu}>← Main menu</Button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-white/45">
          <button
            onClick={onToggleMute}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10"
          >
            {muted ? "🔇 Sound off" : "🔊 Sound on"}
          </button>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
            P / Esc to resume
          </span>
        </div>
      </div>
    </div>
  );
}

function Button({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "w-full rounded-2xl px-5 py-3 text-base font-bold tracking-wide transition-all active:scale-95 " +
        (primary
          ? "bg-gradient-to-br from-amber-300 via-pink-400 to-fuchsia-500 text-white shadow-[0_10px_30px_-10px_rgba(255,80,180,0.6)] hover:scale-[1.01]"
          : "border border-white/15 bg-white/5 text-white/90 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}
