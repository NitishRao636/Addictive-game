type Props = {
  onClose: () => void;
};

export function HelpOverlay({ onClose }: Props) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-white/50">Guide</div>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
              How to play
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-white/80">
          <Section title="Goal">
            Survive endless waves of void creatures. Every 22 seconds ends a wave
            and grants a brief reprieve. Your score rises per kill — combos grow it
            faster.
          </Section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KeyRow title="Keyboard">
              <li>
                <Kbd>WASD</Kbd> / <Kbd>↑↓←→</Kbd> — Move
              </li>
              <li>
                <Kbd>Mouse</Kbd> — Aim
              </li>
              <li>
                <Kbd>Space</Kbd> / Hold <Kbd>Click</Kbd> — Fire
              </li>
              <li>
                <Kbd>P</Kbd> / <Kbd>Esc</Kbd> — Pause
              </li>
              <li>
                <Kbd>R</Kbd> — Restart after game over
              </li>
              <li>
                <Kbd>M</Kbd> — Mute
              </li>
            </KeyRow>
            <KeyRow title="Touch">
              <li>Drag left half — move</li>
              <li>Drag right half — aim & auto-fire</li>
              <li>Tap pause button to pause</li>
              <li>Tap ↻ to restart anytime</li>
            </KeyRow>
          </div>

          <Section title="Enemy types">
            <ul className="mt-2 space-y-1.5">
              <Enemy color="bg-rose-400" name="Grunt" desc="Balanced stats, basic shape." />
              <Enemy color="bg-amber-300" name="Speedy" desc="Diamond, fast, fragile." />
              <Enemy color="bg-violet-400" name="Tank" desc="Hex, slow, takes 3 hits." />
              <Enemy color="bg-emerald-400" name="Splitter" desc="Splits into 2 grunts on death." />
            </ul>
          </Section>

          <Section title="Tips">
            <ul className="mt-2 list-disc space-y-1 pl-5 text-white/70">
              <li>Keep moving — enemies home in on you.</li>
              <li>Chain kills quickly to grow your combo multiplier.</li>
              <li>Splitters multiply: take them out at range.</li>
              <li>After a wave you get a 2.5s breath — reposition to center.</li>
            </ul>
          </Section>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-gradient-to-br from-amber-300 via-pink-400 to-fuchsia-500 px-5 py-3 text-base font-extrabold tracking-wide text-white shadow-[0_10px_30px_-10px_rgba(255,80,180,0.6)] active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-white/55">{title}</h3>
      <div className="mt-1.5 text-white/80">{children}</div>
    </div>
  );
}

function KeyRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/55">
        {title}
      </h4>
      <ul className="space-y-1 text-white/80 [&_li]:flex [&_li]:items-center [&_li]:gap-1.5">
        {children}
      </ul>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[11px] font-mono text-white/90">
      {children}
    </kbd>
  );
}

function Enemy({ color, name, desc }: { color: string; name: string; desc: string }) {
  return (
    <li className="flex items-center gap-2 text-white/80">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="font-bold">{name}</span>
      <span className="text-white/55">— {desc}</span>
    </li>
  );
}
