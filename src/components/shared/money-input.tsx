"use client";

import * as React from "react";

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

/** Ô nhập tiền: format dấu chấm ngăn nghìn, hậu tố "đ", có gợi ý nhân nghìn. */
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

  const display = value > 0 ? formatNumber(value) : "";

  // Chỉ gợi ý khi đang gõ số nhỏ (chưa phải con số đầy đủ).
  const suggestions =
    suggest && value > 0 && value < 1000
      ? MULTIPLIERS.map((m) => ({ ...m, amount: value * m.factor }))
      : [];
  const open = focused && suggestions.length > 0;

  function pick(amount: number) {
    onValueChange(amount);
    setFocused(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        pick(suggestions[active].amount);
      } else if (e.key === "Escape") {
        setFocused(false);
      }
    }
    onKeyDown?.(e);
  }

  return (
    <div className="relative">
      <Input
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
          // Trễ để cú click vào gợi ý kịp xử lý.
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
    </div>
  );
}
