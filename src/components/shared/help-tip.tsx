"use client";

import { HelpCircle } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Icon "?" nhỏ, hover/chạm hiện tooltip giải thích (hiện ngay, delay 0). */
export function HelpTip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className="text-muted-foreground/70 hover:text-foreground"
        aria-label="Giải thích"
      >
        <HelpCircle className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px] text-xs">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
