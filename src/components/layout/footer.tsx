import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-8 text-center">
        <p className="text-sm font-medium">
          Không biết ai trả tiền? Đồng Chi giúp bạn quyết định.
        </p>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0" />
          Không cần đăng ký, không lưu trữ dữ liệu cá nhân. Mọi dữ liệu được xử lý
          ngay trên trình duyệt của bạn.
        </p>
      </div>
    </footer>
  );
}
