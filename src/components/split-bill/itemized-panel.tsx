"use client";

import * as React from "react";
import {
  Plus,
  Copy,
  X,
  RotateCcw,
  CopyPlus,
  Calculator,
  Tag,
  ClipboardPaste,
  Disc3,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/shared/money-input";
import { HelpTip } from "@/components/shared/help-tip";
import { useLocalStorage } from "@/lib/use-local-storage";
import {
  splitItemized,
  type BillRow,
  type ItemizedResult,
} from "@/lib/split";
import { formatVND, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const SAMPLE_ROWS: BillRow[] = [
  { id: "r1", name: "Nguyễn Văn A", price: 45000 },
  { id: "r2", name: "Trần Thị B", price: 60000 },
  { id: "r3", name: "Lê Văn C", price: 35000 },
];

let rowSeq = 0;
function makeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  rowSeq += 1;
  return `row_${rowSeq}_${Math.random().toString(36).slice(2)}`;
}
const newRow = (price = 0): BillRow => ({ id: makeId(), name: "", price });

export function ItemizedPanel({
  headerAction,
  onGoToWheel,
}: {
  headerAction?: React.ReactNode;
  onGoToWheel?: () => void;
}) {
  const [rows, setRows] = useLocalStorage<BillRow[]>(
    "dongchi.itemized.rows",
    SAMPLE_ROWS,
  );
  const [fee, setFee] = useLocalStorage("dongchi.itemized.fee", 0);
  const [discount, setDiscount] = useLocalStorage(
    "dongchi.itemized.discount",
    0,
  );

  const [result, setResult] = React.useState<ItemizedResult | null>(null);
  const [calculating, setCalculating] = React.useState(false);
  const resultRef = React.useRef<HTMLDivElement>(null);

  const [importOpen, setImportOpen] = React.useState(false);
  const [importText, setImportText] = React.useState("");

  // Số người THẬT: gộp các dòng trùng tên. Phí/KM luôn chia đều cho con số này
  // để tổng thu khớp với số tiền đã nhập.
  const divisor = new Set(
    rows
      .filter((r) => r.name.trim() !== "" || r.price > 0)
      .map((r, i) =>
        r.name.trim() ? r.name.trim().toLowerCase() : `__anon_${i}`,
      ),
  ).size;

  function updateRow(id: string, patch: Partial<BillRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRow(id: string) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  }
  function addRow() {
    setRows((rs) => [...rs, newRow()]);
  }
  function duplicateLast() {
    setRows((rs) => [...rs, newRow(rs[rs.length - 1]?.price ?? 0)]);
  }
  function resetAll() {
    setRows(SAMPLE_ROWS.map((r) => ({ ...r })));
    setFee(0);
    setDiscount(0);
    setResult(null);
  }

  function openImport() {
    // Điền sẵn danh sách hiện tại để chỉnh trực tiếp dạng text.
    const text = rows
      .filter((r) => r.name.trim() !== "" || r.price > 0)
      .map((r) => `${r.name.trim()},${r.price > 0 ? r.price : ""}`)
      .join("\n");
    setImportText(text);
    setImportOpen(true);
  }

  function doImport() {
    // Mỗi dòng: "Tên,SốTiền" (ngăn bằng dấu phẩy, tab hoặc chấm phẩy).
    const parsed = importText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.split(/[,;\t]/);
        const name = (m[0] ?? "").trim();
        const price = m[1] ? parseInt(m[1].replace(/[^\d]/g, ""), 10) || 0 : 0;
        return { id: makeId(), name, price };
      })
      .filter((r) => r.name !== "" || r.price > 0);

    if (parsed.length === 0) {
      toast.error("Chưa nhận ra dòng nào. Định dạng: Tên,SốTiền");
      return;
    }
    setRows(parsed);
    setResult(null);
    setImportOpen(false);
    setImportText("");
    toast.success(`Đã nhập ${parsed.length} người`);
  }

  function calculate() {
    const r = splitItemized(rows, fee, discount, divisor);
    if (!r) {
      toast.error("Hãy nhập ít nhất một người kèm số tiền");
      return;
    }
    // Giả lập một nhịp "đang tính" cho cảm giác có xử lý.
    setCalculating(true);
    window.setTimeout(() => {
      setResult(r);
      setCalculating(false);
      // Trên mobile: cuộn xuống bảng kết quả; desktop đã hiện sẵn bên phải.
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        window.setTimeout(
          () =>
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          50,
        );
      }
    }, 200);
  }

  function copyToClipboard(text: string, ok: string) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success(ok))
      .catch(() => toast.error("Không sao chép được"));
  }

  function copyText() {
    if (!result) return;
    copyToClipboard(
      [
        "Đồng Chi - chia tiền:",
        ...result.lines.map((l) => `• ${l.name}: ${formatVND(l.total)}`),
        `Tổng: ${formatVND(result.totals.total)}`,
      ].join("\n"),
      "Đã sao chép, dán vào nhóm chat nhé",
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-10">
      {/* Cột nhập: 4/10 trên desktop */}
      <div className="space-y-4 lg:col-span-4">
      {/* 1. Đơn hàng */}
      <Card className="overflow-visible rounded-2xl">
        <CardContent className="space-y-2.5 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-semibold">
              <span>
                <span className="text-primary">1.</span> Ai gọi món gì?
              </span>
              <HelpTip>
                Mỗi dòng là một người. Nhập tên và số tiền người đó cần trả.
                Người trùng tên sẽ được gộp thành một.
              </HelpTip>
            </h2>
            <div className="flex items-center gap-1.5">
              {headerAction}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Đặt lại danh sách"
                title="Đặt lại danh sách"
                className="size-9 rounded-lg text-muted-foreground/70 hover:text-destructive"
                onClick={resetAll}
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 rounded-lg"
                onClick={openImport}
              >
                <ClipboardPaste className="size-4" />
                Nhập
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            {rows.map((row, i) => (
              <div key={row.id} className="flex items-center gap-1.5">
                <span className="w-4 shrink-0 text-center text-xs font-medium text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
                <Input
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  placeholder="Tên người"
                  className="h-10 flex-1 rounded-lg text-xs"
                />
                <div className="w-28 shrink-0">
                  <MoneyInput
                    value={row.price}
                    onValueChange={(v) => updateRow(row.id, { price: v })}
                    placeholder="0"
                    className="h-10 rounded-lg text-xs"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  aria-label={`Xóa dòng ${i + 1}`}
                  disabled={rows.length <= 1}
                  onClick={() => removeRow(row.id)}
                  className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-lg"
              onClick={addRow}
            >
              <Plus className="size-4" />
              Thêm dòng
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-lg"
              onClick={duplicateLast}
            >
              <CopyPlus className="size-4" />
              Sao chép dòng cuối
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Phí & khuyến mãi */}
      <Card className="overflow-visible rounded-2xl">
        <CardContent className="space-y-2.5 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <h2 className="flex items-center gap-2 font-semibold">
              <Tag className="size-4 text-primary" />
              <span>
                <span className="text-primary">2.</span> Phí áp dụng & khuyến mãi
              </span>
            </h2>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              Chia đều cho <strong>{divisor}</strong> người
              <HelpTip>
                Phí và khuyến mãi được chia đều cho đúng số người trong danh
                sách (đã gộp người trùng tên). Muốn thêm người chỉ share phí mà
                không gọi món thì thêm một dòng với 0đ.
              </HelpTip>
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs">
                Phí áp dụng
                <HelpTip>
                  Tổng phí ship hoặc phí dịch vụ, sẽ được chia đều cho mỗi
                  người.
                </HelpTip>
              </Label>
              <MoneyInput
                value={fee}
                onValueChange={setFee}
                placeholder="0"
                className="h-10 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs">
                Khuyến mãi
                <HelpTip>
                  Tổng tiền giảm giá / khuyến mãi, sẽ được chia đều và trừ cho
                  mỗi người.
                </HelpTip>
              </Label>
              <MoneyInput
                value={discount}
                onValueChange={setDiscount}
                placeholder="0"
                className="h-10 rounded-lg text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      </div>

      {/* Cột kết quả: 6/10 trên desktop, sticky */}
      <div
        ref={resultRef}
        className="lg:col-span-6 lg:sticky lg:top-20 scroll-mt-20"
      >
        <ResultSection
          result={result}
          calculating={calculating}
          onCalculate={calculate}
          onCopyText={copyText}
          onGoToWheel={onGoToWheel}
        />
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nhập danh sách</DialogTitle>
            <DialogDescription>
              Mỗi dòng một người theo dạng <strong>Tên,SốTiền</strong>. Đã điền
              sẵn danh sách hiện tại, bạn sửa hoặc dán đè rồi bấm Nhập.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            autoFocus
            placeholder={"A,40000\nB,20000\nC,20000"}
            className="min-h-[55vh] w-full resize-y rounded-xl border bg-transparent p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="h-11 w-full rounded-xl" onClick={doImport}>
              <ClipboardPaste className="size-4" />
              Nhập danh sách
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResultSection({
  result,
  calculating,
  onCalculate,
  onCopyText,
  onGoToWheel,
}: {
  result: ItemizedResult | null;
  calculating: boolean;
  onCalculate: () => void;
  onCopyText: () => void;
  onGoToWheel?: () => void;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-3 pt-5">
        <h2 className="font-semibold">
          <span className="text-primary">3.</span> Mỗi người cần trả
        </h2>

        {result ? (
          <>
            <ResultBody result={result} />

            <div
              className={cn(
                "grid gap-2",
                onGoToWheel ? "grid-cols-3" : "grid-cols-2",
              )}
            >
              <Button
                className="h-11 rounded-xl font-semibold"
                disabled={calculating}
                onClick={onCalculate}
              >
                {calculating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Calculator className="size-4" />
                )}
                {calculating ? "Đang tính…" : "Tính lại"}
              </Button>
              <Button
                variant="secondary"
                className="h-11 rounded-xl"
                onClick={onCopyText}
              >
                <Copy className="size-4" />
                Sao chép
              </Button>
              {onGoToWheel && (
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                  onClick={onGoToWheel}
                >
                  <Disc3 className="size-4" />
                  Quay số
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nhập đơn hàng bên trái rồi bấm để xem mỗi người phải trả bao nhiêu.
            </p>
            <Button
              size="lg"
              className="h-12 w-full rounded-xl text-base font-semibold"
              disabled={calculating}
              onClick={onCalculate}
            >
              {calculating ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Calculator className="size-5" />
              )}
              {calculating ? "Đang tính…" : "Tính tiền"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Định dạng tiền cho bảng: "22.222 đ" (có dấu cách). */
const d = (n: number) => `${formatNumber(n)} đ`;

function ResultBody({ result }: { result: ItemizedResult }) {
  const { lines, totals } = result;
  const hasFee = totals.feeShare > 0;
  const hasDiscount = totals.discountShare > 0;

  return (
    <>
      {/* Mobile / tablet: thẻ từng người */}
      <div className="space-y-2 lg:hidden">
        {lines.map((l, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-muted/20 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{l.name}</span>
              <span className="text-lg font-bold text-primary">
                {formatVND(l.total)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>
                Món: {d(l.price)}
                {l.items.length > 1 && (
                  <span className="opacity-70">
                    {" "}
                    ({l.items.map(formatNumber).join(" + ")})
                  </span>
                )}
              </span>
              {hasFee && <span>Phí: +{d(l.feeShare)}</span>}
              {hasDiscount && (
                <span className="text-destructive">KM: -{d(l.discountShare)}</span>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-3 font-semibold">
          <span>Tổng ({lines.length} người)</span>
          <span className="text-primary">{formatVND(totals.total)}</span>
        </div>
      </div>

      {/* Desktop: bảng */}
      <div className="hidden lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="py-2 pr-2 font-medium">Tên</th>
              <th className="px-2 py-2 text-right font-medium">Món</th>
              {hasFee && (
                <th className="px-2 py-2 text-right font-medium">Phí</th>
              )}
              {hasDiscount && (
                <th className="px-2 py-2 text-right font-medium">KM</th>
              )}
              <th className="py-2 pl-2 text-right font-medium">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2.5 pr-2 font-medium">{l.name}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">
                  {d(l.price)}
                  {l.items.length > 1 && (
                    <div className="text-xs font-normal text-muted-foreground">
                      {l.items.map(formatNumber).join(" + ")}
                    </div>
                  )}
                </td>
                {hasFee && (
                  <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
                    +{d(l.feeShare)}
                  </td>
                )}
                {hasDiscount && (
                  <td className="px-2 py-2.5 text-right tabular-nums text-destructive">
                    -{d(l.discountShare)}
                  </td>
                )}
                <td className="py-2.5 pl-2 text-right font-semibold tabular-nums text-primary">
                  {d(l.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted font-semibold [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg">
              <td className="rounded-l-lg py-2.5 pl-2 pr-2">
                Tổng ({lines.length} người)
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums">
                {d(totals.price)}
              </td>
              {hasFee && (
                <td className="px-2 py-2.5 text-right tabular-nums">
                  {d(totals.feeShare)}
                </td>
              )}
              {hasDiscount && (
                <td className="px-2 py-2.5 text-right tabular-nums text-destructive">
                  -{d(totals.discountShare)}
                </td>
              )}
              <td className="rounded-r-lg py-2.5 pl-2 pr-2 text-right tabular-nums text-primary">
                {d(totals.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
