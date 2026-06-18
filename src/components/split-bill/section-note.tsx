import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/** Banner ghi chú viền trái cam, lấy cảm hứng từ bản tham khảo. */
export function SectionNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
        className,
      )}
    >
      <Info className="size-4 shrink-0 text-amber-500" />
      <div>{children}</div>
    </div>
  );
}
