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
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/shared/money-input";
import { HelpTip } from "@/components/shared/help-tip";
import { SectionNote } from "@/components/split-bill/section-note";
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
}: {
  headerAction?: React.ReactNode;
}) {
  const [rows, setRows, hydrated] = useLocalStorage<BillRow[]>(
    "dongchi.itemized.rows",
    SAMPLE_ROWS,
  );
  const [fee, setFee] = useLocalStorage("dongchi.itemized.fee", 0);
  const [discount, setDiscount] = useLocalStorage(
    "dongchi.itemized.discount",
    0,
  );

  const [result, setResult] = React.useState<ItemizedResult | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);

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

  function calculate() {
    const r = splitItemized(rows, fee, discount, divisor);
    if (!r) {
      toast.error("Hãy nhập ít nhất một người kèm số tiền");
      return;
    }
    setResult(r);
    // Trên mobile: cuộn xuống bảng kết quả; desktop đã hiện sẵn bên phải.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(
        () =>
          resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        50,
      );
    }
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

  function copyCsv() {
    if (!result) return;
    const head = ["Tên", "Giá", "Phí", "Khuyến mãi", "Thành tiền"];
    const body = result.lines.map((l) =>
      [l.name, l.price, l.feeShare, l.discountShare, l.total].join(","),
    );
    const total = [
      "Tổng",
      result.totals.price,
      result.totals.feeShare,
      result.totals.discountShare,
      result.totals.total,
    ].join(",");
    copyToClipboard(
      [head.join(","), ...body, total].join("\n"),
      "Đã sao chép CSV, dán vào Excel / Sheets",
    );
  }

  return (
    <div
      className={cn(
        "grid items-start gap-4 transition-opacity duration-300 lg:grid-cols-10",
        hydrated ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Cột nhập: 4/10 trên desktop */}
      <div className="space-y-4 lg:col-span-4">
      {/* 1. Đơn hàng */}
      <Card className="overflow-visible rounded-2xl">
        <CardContent className="space-y-2.5 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              <span className="text-primary">1.</span> Ai gọi món gì?
            </h2>
            <div className="flex items-center gap-1">
              {headerAction}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg text-muted-foreground"
                onClick={resetAll}
              >
                <RotateCcw className="size-4" />
                Đặt lại
              </Button>
            </div>
          </div>

          <SectionNote>
            Mỗi dòng là một người. Nhập tên và số tiền người đó cần trả.
          </SectionNote>

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
              Thêm người
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
          <h2 className="flex items-center gap-2 font-semibold">
            <Tag className="size-4 text-primary" />
            <span>
              <span className="text-primary">2.</span> Phí áp dụng & khuyến mãi
            </span>
          </h2>
          <SectionNote>
            <span className="flex items-center gap-1">
              Chia đều cho <strong>{divisor}</strong> người trong danh sách.
              <HelpTip>
                Phí và khuyến mãi được chia đều cho đúng số người trong danh
                sách (đã gộp người trùng tên). Muốn thêm người chỉ share phí mà
                không gọi món thì thêm một dòng với 0đ.
              </HelpTip>
            </span>
          </SectionNote>

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

      {/* Nút tính */}
      <Button
        size="lg"
        className="h-14 w-full rounded-2xl text-base font-semibold"
        onClick={calculate}
      >
        <Calculator className="size-5" />
        Tính tiền
      </Button>
      </div>

      {/* Cột kết quả: 6/10 trên desktop, sticky */}
      <div
        ref={resultRef}
        className="lg:col-span-6 lg:sticky lg:top-20 scroll-mt-20"
      >
        <ResultSection
          result={result}
          onCopyText={copyText}
          onCopyCsv={copyCsv}
        />
      </div>
    </div>
  );
}

function ResultSection({
  result,
  onCopyText,
  onCopyCsv,
}: {
  result: ItemizedResult | null;
  onCopyText: () => void;
  onCopyCsv: () => void;
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
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button className="h-12 rounded-xl" onClick={onCopyText}>
                <Copy className="size-4" />
                Sao chép
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={onCopyCsv}
              >
                <FileSpreadsheet className="size-4" />
                CSV
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <Calculator className="size-6 opacity-50" />
            Nhập đơn hàng rồi bấm <strong>Tính tiền</strong> để xem kết quả.
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
                <td className="py-2.5 pr-2">
                  <div className="font-medium">{l.name}</div>
                  {l.items.length > 1 && (
                    <div className="text-xs text-muted-foreground">
                      {l.items.map(formatNumber).join(" + ")}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums">
                  {d(l.price)}
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
