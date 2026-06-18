"use client";

import * as React from "react";
import { Plus, X, RotateCcw, Sparkles, Undo2, Import } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wheel } from "@/components/wheel/wheel";
import { WinnerDialog } from "@/components/wheel/winner-dialog";
import { useLocalStorage } from "@/lib/use-local-storage";
import { targetRotation } from "@/lib/wheel";
import { cn } from "@/lib/utils";
import type { BillRow } from "@/lib/split";

const DEFAULT_MEMBERS = ["Minh", "An", "Bảo", "Chi"];

export function WheelPanel() {
  const [members, setMembers, hydrated] = useLocalStorage<string[]>(
    "dongchi.wheel.members",
    DEFAULT_MEMBERS,
  );
  const [eliminated, setEliminated] = useLocalStorage<string[]>(
    "dongchi.wheel.eliminated",
    [],
  );
  const [eliminateMode, setEliminateMode] = useLocalStorage(
    "dongchi.wheel.eliminateMode",
    false,
  );
  const [purpose, setPurpose] = useLocalStorage(
    "dongchi.wheel.purpose",
    "đi lấy đồ giúp cả nhóm",
  );

  const [draft, setDraft] = React.useState("");
  const [draftFocused, setDraftFocused] = React.useState(false);
  const [billNames, setBillNames] = React.useState<string[]>([]);
  const [rotation, setRotation] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [winnerIdx, setWinnerIdx] = React.useState<number | null>(null);
  const [showWinner, setShowWinner] = React.useState(false);

  const canSpin = members.length >= 2 && !spinning;

  const spin = React.useCallback(() => {
    if (members.length < 2 || spinning) return;
    const idx = Math.floor(Math.random() * members.length);
    setWinnerIdx(idx);
    setSpinning(true);
    setRotation((r) => targetRotation(r, idx, members.length));
  }, [members.length, spinning]);

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

  // Đọc tên từ danh sách chia tiền (Theo món) để gợi ý, không ghi đè.
  function loadBillNames() {
    try {
      const raw = window.localStorage.getItem("dongchi.itemized.rows");
      const rows = raw ? (JSON.parse(raw) as BillRow[]) : [];
      setBillNames([...new Set(rows.map((r) => r.name.trim()).filter(Boolean))]);
    } catch {
      setBillNames([]);
    }
  }

  const taken = new Set([...members, ...eliminated].map((s) => s.toLowerCase()));
  const query = draft.trim().toLowerCase();
  const suggestions = billNames
    .filter(
      (n) =>
        !taken.has(n.toLowerCase()) &&
        (query === "" || n.toLowerCase().includes(query)),
    )
    .slice(0, 6);
  const showSuggest = draftFocused && suggestions.length > 0;

  function addName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (taken.has(trimmed.toLowerCase())) {
      toast.error("Tên này đã có trong danh sách");
      return;
    }
    setMembers((m) => [...m, trimmed]);
    setDraft("");
  }

  function addMember(e?: React.FormEvent) {
    e?.preventDefault();
    addName(draft);
  }

  function removeMember(name: string) {
    setMembers((m) => m.filter((x) => x !== name));
  }

  function handleSpinEnd() {
    setSpinning(false);
    setShowWinner(true);
  }

  function handleEliminate() {
    if (winnerIdx === null) return;
    const name = members[winnerIdx];
    setMembers((m) => m.filter((_, i) => i !== winnerIdx));
    setEliminated((e) => [...e, name]);
    setShowWinner(false);
  }

  function restoreAll() {
    setMembers((m) => [...m, ...eliminated]);
    setEliminated([]);
  }

  function resetAll() {
    setMembers(DEFAULT_MEMBERS);
    setEliminated([]);
    setRotation(0);
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
      setMembers(names);
      setEliminated([]);
      setRotation(0);
      toast.success(`Đã lấy ${names.length} người từ danh sách chia tiền`);
    } catch {
      toast.error("Không đọc được danh sách chia tiền");
    }
  }

  const winnerName = winnerIdx !== null ? members[winnerIdx] : "";

  return (
    <div
      className={cn(
        "grid items-start gap-4 transition-all duration-300 lg:grid-cols-10",
        hydrated ? "opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      <Card className="rounded-2xl lg:order-2 lg:col-span-7">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-sm font-medium">
              Quay để chọn người…
            </Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="VD: đi lấy đồ, mua cà phê, làm nhiệm vụ…"
              className="h-11 rounded-xl"
            />
          </div>

          <Wheel
            members={members}
            rotation={rotation}
            spinning={spinning}
            canSpin={canSpin}
            onSpin={spin}
            onSpinEnd={handleSpinEnd}
          />

          <Button
            size="lg"
            className="h-14 w-full rounded-2xl text-base font-semibold"
            disabled={!canSpin}
            onClick={spin}
          >
            <Sparkles className="size-5" />
            {spinning ? "Đang quay…" : "Quay ngay"}
          </Button>
          {members.length < 2 && (
            <p className="text-center text-xs text-muted-foreground">
              Cần ít nhất 2 thành viên để quay.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-visible rounded-2xl lg:order-1 lg:col-span-3">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Thành viên ({members.length})
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg text-muted-foreground"
              onClick={resetAll}
            >
              <RotateCcw className="size-4" />
              Đặt lại
            </Button>
          </div>

          <form onSubmit={addMember} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => {
                  setDraftFocused(true);
                  loadBillNames();
                }}
                onBlur={() => setTimeout(() => setDraftFocused(false), 120)}
                placeholder="Thêm tên thành viên…"
                className="h-11 rounded-xl"
              />
              {showSuggest && (
                <ul className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border bg-popover py-1 shadow-lg">
                  <li className="px-3 pb-1 pt-0.5 text-[11px] font-medium uppercase text-muted-foreground">
                    Từ danh sách chia tiền
                  </li>
                  {suggestions.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addName(name);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <Plus className="size-3.5 text-muted-foreground" />
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0 rounded-xl"
              aria-label="Thêm thành viên"
            >
              <Plus className="size-5" />
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-xl"
            onClick={importFromBill}
          >
            <Import className="size-4" />
            Lấy từ danh sách chia tiền
          </Button>

          {members.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {members.map((name) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className="gap-1 rounded-lg py-1.5 pl-3 pr-1.5 text-sm font-medium"
                >
                  {name}
                  <button
                    type="button"
                    aria-label={`Xóa ${name}`}
                    onClick={() => removeMember(name)}
                    className="rounded-md p-0.5 hover:bg-foreground/10"
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa có thành viên nào. Thêm tên để bắt đầu quay.
            </p>
          )}

          {eliminated.length > 0 && (
            <div className="space-y-2 rounded-xl bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Đã được chọn ({eliminated.length})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-lg text-xs"
                  onClick={restoreAll}
                >
                  <Undo2 className="size-3.5" />
                  Khôi phục
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {eliminated.map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="rounded-lg text-xs text-muted-foreground line-through"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={eliminateMode}
              onChange={(e) => setEliminateMode(e.target.checked)}
              className="size-4 accent-primary"
            />
            <span className="text-muted-foreground">
              Loại người đã được chọn ra khỏi vòng sau
            </span>
          </label>
        </CardContent>
      </Card>

      <WinnerDialog
        open={showWinner}
        onOpenChange={setShowWinner}
        name={winnerName}
        purpose={purpose}
        eliminateMode={eliminateMode}
        onEliminate={handleEliminate}
      />
    </div>
  );
}
