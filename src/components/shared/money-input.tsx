"use client";

import * as React from "react";
import { Calculator } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatNumber, parseNumber, formatVND } from "@/lib/format";

interface MoneyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  value: number;
  onValueChange: (value: number) => void;
  /** Hiện dropdown gợi ý nhân nghìn khi gõ số nhỏ (15 → 15.000 / 150.000…) */
  suggest?: boolean;
}

const MULTIPLIERS: { factor: number; label: string }[] = [
  { factor: 1_000, label: "nghìn" },
  { factor: 10_000, label: "chục nghìn" },
  { factor: 100_000, label: "trăm nghìn" },
  { factor: 1_000_000, label: "triệu" },
];

const HAS_OP = /[+\-*/]/;

/** Tính giá trị từ chuỗi (bỏ dấu chấm ngăn nghìn). Trả null nếu không hợp lệ. */
function calcResult(text: string): number | null {
  const cleaned = text.replace(/[.\s]/g, "").replace(/[^0-9+\-*/()]/g, "");
  if (!cleaned) return null;
  if (!HAS_OP.test(cleaned)) return parseNumber(cleaned);
  try {
    const result = Function(`"use strict"; return (${cleaned})`)();
    if (typeof result === "number" && Number.isFinite(result)) {
      return Math.max(0, Math.round(result));
    }
  } catch {
    // biểu thức sai cú pháp
  }
  return null;
}

/**
 * Ô nhập tiền: format dấu chấm ngăn nghìn, hậu tố "đ", gợi ý nhân nghìn.
 * Bấm "=" để mở ô phép tính, nhập biểu thức (vd 50000+30000) rồi Enter áp dụng.
 */
export function MoneyInput({
  value,
  onValueChange,
  className,
  suggest = true,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: MoneyInputProps) {
  const [focused, setFocused] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [calcOpen, setCalcOpen] = React.useState(false);
  const [calcText, setCalcText] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  function closeCalc() {
    setCalcOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const display = value > 0 ? formatNumber(value) : "";

  const suggestions =
    suggest && !calcOpen && value > 0 && value < 1000
      ? MULTIPLIERS.map((m) => ({ ...m, amount: value * m.factor }))
      : [];
  const open = focused && suggestions.length > 0;

  function pick(amount: number) {
    onValueChange(amount);
    setFocused(false);
  }

  function openCalc() {
    setCalcText(value > 0 ? String(value) : "");
    setCalcOpen(true);
  }

  function applyCalc() {
    const r = calcResult(calcText);
    if (r !== null) onValueChange(r);
    closeCalc();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "=") {
      e.preventDefault();
      openCalc();
      return;
    }
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        pick(suggestions[active].amount);
        return;
      }
      if (e.key === "Escape") {
        setFocused(false);
      }
    }
    onKeyDown?.(e);
  }

  const preview = calcOpen ? calcResult(calcText) : null;

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        inputMode="numeric"
        value={display}
        onChange={(e) => {
          onValueChange(parseNumber(e.target.value));
          setActive(0);
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setTimeout(() => setFocused(false), 120);
          onBlur?.(e);
        }}
        onKeyDown={handleKeyDown}
        className={cn("h-12 rounded-xl pr-9 text-base font-medium", className)}
        {...props}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        đ
      </span>

      {open && (
        <ul className="absolute right-0 top-full z-30 mt-1 min-w-44 overflow-hidden rounded-xl border bg-popover py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s.factor}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s.amount);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                  i === active ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <span className="font-medium">{formatVND(s.amount)}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {calcOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onMouseDown={() => closeCalc()}
          />
          <div className="absolute bottom-full left-0 right-0 z-40 mb-1 origin-bottom animate-in fade-in zoom-in-95 slide-in-from-bottom-1 rounded-xl border bg-popover p-2 shadow-lg duration-150">
            <div className="mb-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
              <Calculator className="size-3.5" />
              Nhập phép tính, vd 50000+30000
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border px-2 focus-within:ring-2 focus-within:ring-ring/50">
              <span className="select-none text-sm font-semibold text-muted-foreground">
                =
              </span>
              <input
                autoFocus
                inputMode="text"
                value={calcText}
                onChange={(e) => setCalcText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "=") {
                    e.preventDefault();
                    applyCalc();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    closeCalc();
                  }
                }}
                className="flex-1 bg-transparent py-1.5 text-sm outline-none"
              />
            </div>
            <div className="mt-1 flex items-center justify-between px-1 text-xs">
              <span className="text-muted-foreground">Enter để áp dụng</span>
              <span className="font-semibold text-primary">
                {preview !== null ? `= ${formatVND(preview)}` : ""}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
