"use client";

import * as React from "react";
import { Minus, Plus, Users, Wallet, Lightbulb, ArrowDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MoneyInput } from "@/components/shared/money-input";
import { useLocalStorage } from "@/lib/use-local-storage";
import { splitGrab } from "@/lib/split";
import { formatVND } from "@/lib/format";

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

export function GrabPanel() {
  const [total, setTotal] = useLocalStorage("dongchi.grab.total", 0);
  const [people, setPeople] = useLocalStorage("dongchi.grab.people", 3);

  const result = splitGrab(total, people);

  return (
    <div className="space-y-4">
      <Card className="overflow-visible rounded-2xl">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="size-4 text-primary" />
              Tổng tiền
            </Label>
            <MoneyInput
              value={total}
              onValueChange={setTotal}
              placeholder="Nhập tổng hóa đơn…"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setTotal((t) => t + amt)}
                >
                  +{formatVND(amt)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4 text-primary" />
              Số người
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-12 rounded-xl"
                aria-label="Bớt một người"
                disabled={people <= 1}
                onClick={() => setPeople((p) => Math.max(1, p - 1))}
              >
                <Minus className="size-5" />
              </Button>
              <div className="flex-1 text-center text-2xl font-bold tabular-nums">
                {people}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-12 rounded-xl"
                aria-label="Thêm một người"
                onClick={() => setPeople((p) => Math.min(50, p + 1))}
              >
                <Plus className="size-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ResultCard result={result} people={people} />
    </div>
  );
}

function ResultCard({
  result,
  people,
}: {
  result: ReturnType<typeof splitGrab>;
  people: number;
}) {
  if (!result) {
    return (
      <Card className="rounded-2xl border-dashed bg-muted/30">
        <CardContent className="flex items-center justify-center gap-1.5 py-8 text-center text-sm text-muted-foreground">
          <ArrowDown className="size-4" />
          Nhập tổng tiền để tính mỗi người cần trả
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-primary/30 bg-primary/5">
      <CardContent className="space-y-4 pt-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Mỗi người cần trả</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight text-primary">
            {formatVND(result.perPerson)}
          </p>
        </div>

        <Separator />

        <dl className="space-y-2 text-sm">
          <Row
            label={`Chia đều cho ${people} người`}
            value={formatVND(result.exact)}
          />
          <Row
            label="Tổng sau làm tròn"
            value={formatVND(result.roundedTotal)}
          />
          {result.surplus > 0 && (
            <Row
              label="Dư ra (làm tròn lên 1.000đ)"
              value={`+${formatVND(result.surplus)}`}
              muted
            />
          )}
        </dl>

        {result.surplus > 0 && (
          <p className="flex gap-2 rounded-xl bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            <Lightbulb className="size-4 shrink-0 text-primary" />
            <span>
              Mỗi người trả {formatVND(result.perPerson)} cho chẵn. Phần dư{" "}
              {formatVND(result.surplus)} coi như tip hoặc để người gom tiền giữ.
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={muted ? "text-muted-foreground" : "font-semibold"}>
        {value}
      </dd>
    </div>
  );
}
