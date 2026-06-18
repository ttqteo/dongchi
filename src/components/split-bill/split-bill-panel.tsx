"use client";

import * as React from "react";
import { Equal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GrabPanel } from "@/components/split-bill/grab-panel";
import { ItemizedPanel } from "@/components/split-bill/itemized-panel";

export function SplitBillPanel({
  onGoToWheel,
}: {
  onGoToWheel?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <ItemizedPanel
        onGoToWheel={onGoToWheel}
        headerAction={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => setOpen(true)}
          >
            <Equal className="size-4" />
            Chia đều
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chia đều nhanh</DialogTitle>
            <DialogDescription>
              Nhập tổng tiền và số người để chia đều, làm tròn lên 1.000đ.
            </DialogDescription>
          </DialogHeader>
          <GrabPanel />
        </DialogContent>
      </Dialog>
    </div>
  );
}
