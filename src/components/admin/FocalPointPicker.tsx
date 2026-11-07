import { useRef, type KeyboardEvent, type PointerEvent } from 'react';

interface Props {
  src: string;
  x: number;
  y: number;
  aspect: string;
  onChange: (x: number, y: number) => void;
}

const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

/** Rasm ustiga bosib fokus nuqtasini tanlash → saytda object-position */
export default function FocalPointPicker({ src, x, y, aspect, onChange }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);

  const setFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    onChange(
      clamp(((e.clientX - box.left) / box.width) * 100),
      clamp(((e.clientY - box.top) / box.height) * 100),
    );
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    onChange(clamp(x + d[0]), clamp(y + d[1]));
  };

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
      <div>
        <div
          ref={boxRef}
          role="slider"
          tabIndex={0}
          aria-label="Fokus nuqtasi"
          aria-valuetext={`Gorizontal ${x}%, vertikal ${y}%`}
          aria-valuenow={x}
          aria-valuemin={0}
          aria-valuemax={100}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setFromPointer(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) setFromPointer(e);
          }}
          onKeyDown={onKey}
          className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-2xl border border-line bg-blush-100"
        >
          <img
            src={src}
            alt=""
            className="block max-h-[46vh] w-full object-contain"
            draggable={false}
          />
          <span
            className="pointer-events-none absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/35 shadow-[0_0_0_2px_rgba(160,82,106,0.9)]"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-hidden="true"
          />
        </div>
        <p className="mt-2 text-[13px] text-ink-soft">
          Rasmning eng muhim joyiga bosing (masalan, yuz). Kesilganda shu joy markazda qoladi.
        </p>
      </div>
      <div>
        <p className="text-[12px] font-bold tracking-[0.18em] text-ink-soft">SAYTDA</p>
        <div
          className="mt-2 overflow-hidden rounded-xl border border-line bg-blush-100"
          style={{ aspectRatio: aspect }}
        >
          <img
            src={src}
            alt=""
            className="block size-full object-cover"
            style={{ objectPosition: `${x}% ${y}%` }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
