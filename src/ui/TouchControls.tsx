import { useEffect, useRef } from "react";

type Handlers = {
  onAim: (x: number, y: number, active: boolean) => void;
  onFire: (firing: boolean) => void;
  onMove: (x: number, y: number, active: boolean) => void;
};

type Props = {
  handlers: Handlers;
};

// Touch scheme:
// - Left half  = drag for movement (joystick)
// - Right half = drag for aim (joystick) + auto-fire while held
// - Single finger anywhere works for aim/fire as fallback if needed.
export function TouchControls({ handlers }: Props) {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    type Stick = {
      el: HTMLDivElement;
      knob: HTMLDivElement;
      activeId: number | null;
      cx: number;
      cy: number;
      radius: number;
    };

    const leftStick: Stick = {
      el: left,
      knob: left.querySelector("[data-knob]") as HTMLDivElement,
      activeId: null,
      cx: 0,
      cy: 0,
      radius: 60,
    };
    const rightStick: Stick = {
      el: right,
      knob: right.querySelector("[data-knob]") as HTMLDivElement,
      activeId: null,
      cx: 0,
      cy: 0,
      radius: 60,
    };

    const start = (s: Stick, e: PointerEvent) => {
      if (s.activeId !== null) return;
      s.activeId = e.pointerId;
      const r = s.el.getBoundingClientRect();
      s.cx = r.left + r.width / 2;
      s.cy = r.top + r.height / 2;
      s.el.setPointerCapture(e.pointerId);
      move(s, e);
      if (s === rightStick) handlers.onFire(true);
    };
    const move = (s: Stick, e: PointerEvent) => {
      if (s.activeId !== e.pointerId) return;
      const dx = e.clientX - s.cx;
      const dy = e.clientY - s.cy;
      const dist = Math.hypot(dx, dy);
      const max = s.radius;
      const k = dist > max ? max / dist : 1;
      const kx = dx * k;
      const ky = dy * k;
      s.knob.style.transform = `translate(${kx}px, ${ky}px)`;
      if (s === leftStick) {
        handlers.onMove(kx / max, ky / max, true);
      } else {
        handlers.onAim(kx / max, ky / max, true);
      }
    };
    const end = (s: Stick, e: PointerEvent) => {
      if (s.activeId !== e.pointerId) return;
      s.activeId = null;
      s.knob.style.transform = "translate(0,0)";
      if (s === leftStick) handlers.onMove(0, 0, false);
      else {
        handlers.onAim(0, 0, false);
        handlers.onFire(false);
      }
    };

    const ls = (e: PointerEvent) => start(leftStick, e);
    const lm = (e: PointerEvent) => move(leftStick, e);
    const le = (e: PointerEvent) => end(leftStick, e);
    const rs = (e: PointerEvent) => start(rightStick, e);
    const rm = (e: PointerEvent) => move(rightStick, e);
    const re_ = (e: PointerEvent) => end(rightStick, e);

    left.addEventListener("pointerdown", ls);
    left.addEventListener("pointermove", lm);
    left.addEventListener("pointerup", le);
    left.addEventListener("pointercancel", le);
    right.addEventListener("pointerdown", rs);
    right.addEventListener("pointermove", rm);
    right.addEventListener("pointerup", re_);
    right.addEventListener("pointercancel", re_);

    return () => {
      left.removeEventListener("pointerdown", ls);
      left.removeEventListener("pointermove", lm);
      left.removeEventListener("pointerup", le);
      left.removeEventListener("pointercancel", le);
      right.removeEventListener("pointerdown", rs);
      right.removeEventListener("pointermove", rm);
      right.removeEventListener("pointerup", re_);
      right.removeEventListener("pointercancel", re_);
    };
  }, [handlers]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] sm:hidden">
      {/* touch zones only on small screens */}
      <div
        ref={leftRef}
        className="pointer-events-auto absolute bottom-0 left-0 flex h-1/2 w-1/2 touch-none items-center justify-center"
      >
        <div className="relative grid h-32 w-32 place-items-center">
          <div className="absolute inset-0 rounded-full border border-white/15 bg-white/[0.04]" />
          <div
            data-knob
            className="h-14 w-14 rounded-full border border-white/25 bg-white/15 shadow-inner backdrop-blur"
            style={{ transition: "transform 80ms linear" }}
          />
          <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Move
          </div>
        </div>
      </div>
      <div
        ref={rightRef}
        className="pointer-events-auto absolute bottom-0 right-0 flex h-1/2 w-1/2 touch-none items-center justify-center"
      >
        <div className="relative grid h-32 w-32 place-items-center">
          <div className="absolute inset-0 rounded-full border border-white/15 bg-white/[0.04]" />
          <div
            data-knob
            className="h-14 w-14 rounded-full border border-white/25 bg-white/15 shadow-inner backdrop-blur"
            style={{ transition: "transform 80ms linear" }}
          />
          <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Aim · Fire
          </div>
        </div>
      </div>
    </div>
  );
}
