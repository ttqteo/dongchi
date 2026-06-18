"use client";

import { PartyPopper, RotateCcw, UserMinus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WinnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  purpose: string;
  eliminateMode: boolean;
  onEliminate: () => void;
}

export function WinnerDialog({
  open,
  onOpenChange,
  name,
  purpose,
  eliminateMode,
  onEliminate,
}: WinnerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <PartyPopper className="size-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Tèng tèng!</DialogTitle>
          <DialogDescription className="text-base">
            Cả nhóm đã chốt, người được gọi tên là
          </DialogDescription>
        </DialogHeader>

        <p className="py-1 text-center text-3xl font-extrabold text-primary">
          {name}
        </p>
        {purpose.trim() && (
          <p className="text-center text-sm text-muted-foreground">
            Nhiệm vụ: {purpose.trim()}
          </p>
        )}

        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          <Button
            className="w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            <RotateCcw className="size-4" />
            Quay lại
          </Button>
          {eliminateMode && (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={onEliminate}
            >
              <UserMinus className="size-4" />
              Loại {name} & quay tiếp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
