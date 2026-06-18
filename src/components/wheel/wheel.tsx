"use client";

import { motion } from "framer-motion";

import { slicePath, pointOnCircle, wheelColor } from "@/lib/wheel";
import { cn } from "@/lib/utils";

const SIZE = 240;
const C = SIZE / 2;
const R = C - 6;

interface WheelProps {
  members: string[];
  rotation: number;
  spinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
  onSpinEnd: () => void;
}

export function Wheel({
  members,
  rotation,
  spinning,
  canSpin,
  onSpin,
  onSpinEnd,
}: WheelProps) {
  const n = members.length;
  const seg = n > 0 ? 360 / n : 360;

  return (
    <div className="mx-auto aspect-square w-full max-w-md lg:max-w-xl">
      <div
        role="button"
        tabIndex={0}
        aria-label="Quay vòng may mắn"
        onClick={() => canSpin && onSpin()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && canSpin) {
            e.preventDefault();
            onSpin();
          }
        }}
        className={cn("relative size-full cursor-pointer select-none outline-none")}
      >
        {/* Kim chỉ ở đỉnh */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
          <div className="size-0 border-x-14 border-t-22 border-x-transparent border-t-primary drop-shadow-md" />
        </div>

        <motion.div
          className="size-full drop-shadow-xl"
          style={{ transformOrigin: "50% 50%" }}
          animate={{ rotate: rotation }}
          transition={{ duration: spinning ? 4 : 0, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => {
            if (spinning) onSpinEnd();
          }}
        >
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full">
            <defs>
              <radialGradient id="wheel-gloss" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="white" stopOpacity="0.35" />
                <stop offset="45%" stopColor="white" stopOpacity="0.08" />
                <stop offset="100%" stopColor="black" stopOpacity="0.12" />
              </radialGradient>
            </defs>

            {/* Vành ngoài */}
            <circle cx={C} cy={C} r={R + 4} className="fill-foreground/10" />

            {n === 0 ? (
              <circle cx={C} cy={C} r={R} className="fill-muted" />
            ) : (
              members.map((name, i) => {
                const a0 = i * seg;
                const a1 = (i + 1) * seg;
                const mid = a0 + seg / 2;
                // Chữ chạy dọc theo bán kính, từ tâm ra rìa (kiểu wheelofnames).
                const [tx, ty] = pointOnCircle(C, C, R * 0.3, mid);
                return (
                  <g key={`${name}-${i}`}>
                    <path
                      d={slicePath(C, C, R, a0, a1)}
                      fill={wheelColor(i)}
                      stroke="white"
                      strokeWidth={2}
                    />
                    <text
                      x={tx}
                      y={ty}
                      fill="white"
                      fontSize={n > 12 ? 10 : n > 8 ? 12 : 14}
                      fontWeight={700}
                      textAnchor="start"
                      dominantBaseline="middle"
                      transform={`rotate(${mid - 90}, ${tx}, ${ty})`}
                      style={{
                        pointerEvents: "none",
                        paintOrder: "stroke",
                        stroke: "rgba(0,0,0,0.22)",
                        strokeWidth: 2.5,
                      }}
                    >
                      {truncate(name, n > 8 ? 9 : 12)}
                    </text>
                  </g>
                );
              })
            )}

            {/* Lớp bóng */}
            <circle
              cx={C}
              cy={C}
              r={R}
              fill="url(#wheel-gloss)"
              style={{ pointerEvents: "none" }}
            />
          </svg>
        </motion.div>

        {/* Trục giữa */}
        <div className="absolute left-1/2 top-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-background bg-background shadow-lg">
          <div className="size-9 rounded-full bg-primary" />
        </div>

        {/* Gợi ý bấm để quay */}
        {!spinning && canSpin && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="rounded-full bg-foreground/70 px-3 py-1 text-xs font-medium text-background backdrop-blur-sm">
              Bấm để quay
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
