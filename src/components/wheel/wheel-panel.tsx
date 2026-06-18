"use client";

import * as React from "react";
import {
  RotateCcw,
  Import,
  Shuffle,
  ArrowDownAZ,
  ChevronsUp,
  ChevronsDown,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wheel } from "@/components/wheel/wheel";
import { WinnerDialog } from "@/components/wheel/winner-dialog";
import { useLocalStorage } from "@/lib/use-local-storage";
import { targetRotation } from "@/lib/wheel";
import { cn } from "@/lib/utils";
import type { BillRow } from "@/lib/split";

const DEFAULT_TEXT = ["Minh", "An", "Bảo", "Chi"].join("\n");

const MAX_MEMBERS = 200;

/**
 * Dưới trần: giữ nguyên (cho phép dòng trống để Enter/chèn ở giữa).
 * Đủ/vượt trần: bỏ sạch dòng trống và giữ đúng MAX_MEMBERS tên liền mạch
 * -> không thể Enter/chèn thêm ở bất kỳ đâu khi đã đủ 200.
 */
function clampText(value: string): string {
  const lines = value.split(/\r?\n/);
  const nameCount = lines.filter((l) => l.trim() !== "").length;
  if (nameCount < MAX_MEMBERS) return value;

  const names: string[] = [];
  for (const line of lines) {
    if (line.trim() !== "" && names.length < MAX_MEMBERS) names.push(line);
  }
  return names.join("\n");
}

function parseMembers(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_MEMBERS);
}

export function WheelPanel({ importHintKey }: { importHintKey?: number }) {
  const [text, setText] = useLocalStorage("dongchi.wheel.text", DEFAULT_TEXT);
  const [purpose, setPurpose] = useLocalStorage(
    "dongchi.wheel.purpose",
    "đi lấy đồ giúp cả nhóm",
  );
  const [spinSeconds, setSpinSeconds] = useLocalStorage(
    "dongchi.wheel.seconds",
    4,
  );

  const [rotation, setRotation] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [duration, setDuration] = React.useState(4);
  const [winnerIdx, setWinnerIdx] = React.useState<number | null>(null);
  const [showWinner, setShowWinner] = React.useState(false);
  const gutterRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const caretRef = React.useRef(0);
  const [limitHit, setLimitHit] = React.useState(false);
  const limitTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hintImport, setHintImport] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // Khi vừa điều hướng từ Chia tiền sang: gợi ý nút "Lấy từ danh sách chia tiền".
  React.useEffect(() => {
    if (!importHintKey) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHintImport(true);
    const t = setTimeout(() => setHintImport(false), 8000);
    return () => clearTimeout(t);
  }, [importHintKey]);

  const members = parseMembers(text);
  const canSpin = members.length >= 2 && !spinning;
  const lineCount = text.split(/\r?\n/).length;

  const spin = React.useCallback(() => {
    const list = parseMembers(text);
    if (list.length < 2 || spinning) return;
    const idx = Math.floor(Math.random() * list.length);
    const spins = 4 + Math.floor(Math.random() * 4); // 4..7 vòng
    const jitter = (Math.random() - 0.5) * 1.6;
    setWinnerIdx(idx);
    setDuration(spinSeconds);
    setSpinning(true);
    setRotation((r) => targetRotation(r, idx, list.length, { spins, jitter }));
  }, [text, spinning, spinSeconds]);

  // Ctrl/Cmd + Enter để quay nhanh.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        spin();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spin]);

  function handleSpinEnd() {
    setSpinning(false);
    setShowWinner(true);
  }

  function handleEliminate() {
    if (winnerIdx === null) return;
    const name = members[winnerIdx];
    setText((t) => parseMembers(t).filter((n) => n !== name).join("\n"));
    setRotation(0);
    setShowWinner(false);
  }

  function importFromBill() {
    try {
      const raw = window.localStorage.getItem("dongchi.itemized.rows");
      const rows = raw ? (JSON.parse(raw) as BillRow[]) : [];
      const names = [...new Set(rows.map((r) => r.name.trim()).filter(Boolean))];
      if (names.length === 0) {
        toast.error("Danh sách chia tiền chưa có tên nào");
        return;
      }
      setText(names.join("\n"));
      setRotation(0);
      setHintImport(false);
      toast.success(`Đã lấy ${names.length} người từ danh sách chia tiền`);
    } catch {
      toast.error("Không đọc được danh sách chia tiền");
    }
  }

  function shuffle() {
    const arr = parseMembers(text);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setText(arr.join("\n"));
  }

  function sortAZ() {
    setText(
      parseMembers(text)
        .sort((a, b) => a.localeCompare(b, "vi"))
        .join("\n"),
    );
  }

  function resetAll() {
    setText(DEFAULT_TEXT);
    setRotation(0);
  }

  function scrollList(to: "top" | "bottom") {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.scrollTo({
      top: to === "top" ? 0 : el.scrollHeight,
      behavior: "smooth",
    });
  }

  function handleTextChange(value: string) {
    const clamped = clampText(value);
    const changed = clamped !== value;
    // Chỉ cảnh báo khi đã chạm trần mà text vẫn bị cắt (gõ/Enter thêm bị chặn).
    const blockedAtCap = changed && parseMembers(clamped).length >= MAX_MEMBERS;
    if (blockedAtCap) {
      toast.warning(`Đã đủ ${MAX_MEMBERS} người, không thể thêm.`);
      setLimitHit(true);
      if (limitTimer.current) clearTimeout(limitTimer.current);
      limitTimer.current = setTimeout(() => setLimitHit(false), 1800);
    }
    // clamped có thể trùng state hiện tại -> setText không re-render -> ép DOM revert.
    // Khôi phục con trỏ về đúng chỗ đang gõ (tránh nhảy về cuối).
    if (changed && textareaRef.current) {
      const el = textareaRef.current;
      const pos = Math.min(caretRef.current, clamped.length);
      el.value = clamped;
      el.setSelectionRange(pos, pos);
      requestAnimationFrame(() => el.setSelectionRange(pos, pos));
    }
    setText(clamped);
  }

  const winnerName = winnerIdx !== null ? (members[winnerIdx] ?? "") : "";

  return (
    <div className="grid gap-4 lg:grid-cols-10">
      {/* Wheel: 7/10 */}
      <Card className="overflow-visible rounded-2xl lg:order-2 lg:col-span-7">
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="purpose"
              className="shrink-0 whitespace-nowrap text-sm font-medium"
            >
              Quay để chọn người…
            </Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="VD: đi lấy đồ, mua cà phê, làm nhiệm vụ…"
              className="h-11 flex-1 rounded-xl"
            />
            <div className="relative shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Cài đặt vòng quay"
                className="size-11 rounded-xl"
                onClick={() => setSettingsOpen((o) => !o)}
              >
                <Settings2 className="size-5" />
              </Button>
              {settingsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setSettingsOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border bg-popover p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between text-sm font-medium">
                      <span>Thời gian quay</span>
                      <span className="tabular-nums text-primary">
                        {spinSeconds}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={12}
                      step={0.5}
                      value={spinSeconds}
                      disabled={spinning}
                      onChange={(e) => setSpinSeconds(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer accent-primary"
                      aria-label="Thời gian quay (giây)"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>2s</span>
                      <span>12s</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Wheel
            members={members}
            rotation={rotation}
            spinning={spinning}
            duration={duration}
            canSpin={canSpin}
            onSpin={spin}
            onSpinEnd={handleSpinEnd}
          />

          <p className="text-center text-sm text-muted-foreground">
            {members.length < 2
              ? "Cần ít nhất 2 thành viên để quay."
              : spinning
                ? "Đang quay…"
                : "Click vào vòng quay để quay (hoặc Ctrl/Cmd + Enter)."}
          </p>
        </CardContent>
      </Card>

      {/* Danh sách: 3/10 */}
      <Card className="rounded-2xl lg:order-1 lg:col-span-3">
        <CardContent className="flex flex-1 flex-col gap-3 pt-6">
          <div className="flex items-center justify-between gap-1">
            <Label className="shrink-0 text-sm font-medium">
              Thành viên ({members.length})
            </Label>
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg px-2 text-muted-foreground"
                onClick={shuffle}
                disabled={members.length < 2}
              >
                <Shuffle className="size-4" />
                Xáo trộn
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg px-2 text-muted-foreground"
                onClick={sortAZ}
                disabled={members.length < 2}
              >
                <ArrowDownAZ className="size-4" />
                A-Z
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Đặt lại danh sách"
                title="Đặt lại danh sách"
                className="size-8 rounded-lg text-muted-foreground/70 hover:text-destructive"
                onClick={resetAll}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </div>

          <div className="relative flex min-h-60 flex-1 overflow-hidden rounded-xl border focus-within:ring-2 focus-within:ring-ring/50">
            {limitHit && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
                <div className="mt-2 animate-in fade-in slide-in-from-top-1 rounded-lg bg-destructive px-3 py-1 text-xs font-medium text-white shadow-md">
                  Đã đủ {MAX_MEMBERS} người, không thể thêm
                </div>
              </div>
            )}
            {/* Gutter STT, đồng bộ scroll với textarea */}
            <div
              ref={gutterRef}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 w-9 select-none py-3 pr-2 text-right text-sm leading-7 text-muted-foreground/40"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="tabular-nums">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={text}
              onKeyDown={(e) => {
                caretRef.current = e.currentTarget.selectionStart ?? 0;
              }}
              onChange={(e) => handleTextChange(e.target.value)}
              onScroll={(e) => {
                if (gutterRef.current) {
                  gutterRef.current.style.transform = `translateY(${-e.currentTarget.scrollTop}px)`;
                }
              }}
              rows={10}
              placeholder={"Minh\nAn\nBảo"}
              className="size-full resize-none bg-transparent py-3 pl-11 pr-3 text-sm leading-7 outline-none"
            />
            {lineCount > 12 && (
              <div className="absolute bottom-2 right-3 z-10 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => scrollList("top")}
                  aria-label="Lên đầu danh sách"
                  className="flex size-7 items-center justify-center rounded-md border bg-background/80 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground"
                >
                  <ChevronsUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollList("bottom")}
                  aria-label="Xuống cuối danh sách"
                  className="flex size-7 items-center justify-center rounded-md border bg-background/80 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground"
                >
                  <ChevronsDown className="size-4" />
                </button>
              </div>
            )}
          </div>
          {members.length >= MAX_MEMBERS && (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
              Đã đủ {MAX_MEMBERS} người, không thể thêm.
            </p>
          )}

          <div className="relative">
            {hintImport && (
              <span className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full animate-bounce whitespace-nowrap rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-md">
                Lấy danh sách vừa chia ở đây
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 w-full rounded-xl",
                hintImport &&
                  "animate-pulse border-primary text-primary ring-2 ring-primary ring-offset-2",
              )}
              onClick={importFromBill}
            >
              <Import className="size-4" />
              Lấy từ danh sách chia tiền
            </Button>
          </div>
        </CardContent>
      </Card>

      <WinnerDialog
        open={showWinner}
        onOpenChange={setShowWinner}
        name={winnerName}
        purpose={purpose}
        onEliminate={handleEliminate}
      />
    </div>
  );
}
