import Link from "next/link";
import { Target } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Target className="size-5" />
          </span>
          <span>Đồng Chi</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            render={<Link href="/huong-dan" />}
            nativeButton={false}
            variant="ghost"
            className="rounded-xl max-sm:hidden"
          >
            Hướng dẫn
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
