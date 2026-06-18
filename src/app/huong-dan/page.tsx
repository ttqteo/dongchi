import type { Metadata } from "next";
import Link from "next/link";
import { Equal, ListChecks, Disc3, ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Hướng dẫn · Đồng Chi",
  description: "Cách dùng Đồng Chi để chia tiền và quay số cho nhóm.",
};

const GUIDES = [
  {
    icon: Equal,
    title: "Chia đều",
    steps: [
      "Nhập tổng hóa đơn và số người.",
      "Đồng Chi chia đều, làm tròn lên 1.000đ cho dễ chuyển khoản.",
      "Phần dư hiển thị rõ để cả nhóm biết.",
    ],
  },
  {
    icon: ListChecks,
    title: "Chia theo món",
    steps: [
      "Mỗi dòng là một người, nhập tên và giá món của họ.",
      "Thêm phí áp dụng và khuyến mãi nếu có, sẽ chia đều cho mỗi người.",
      "Xem bảng kết quả và bấm Sao chép để dán vào nhóm chat.",
    ],
  },
  {
    icon: Disc3,
    title: "Quay số",
    steps: [
      "Thêm tên các thành viên trong nhóm.",
      "Nhập việc cần chọn người, ví dụ đi lấy đồ hay mua cà phê.",
      "Bấm Quay ngay để chọn ngẫu nhiên một người.",
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-10">
      <Button
        render={<Link href="/" />}
        nativeButton={false}
        variant="ghost"
        size="sm"
        className="mb-4 rounded-xl"
      >
        <ArrowLeft className="size-4" />
        Về trang chính
      </Button>

      <h1 className="text-2xl font-bold tracking-tight">Hướng dẫn</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Đồng Chi giúp nhóm bạn chia chi phí và chọn người thực hiện nhiệm vụ.
        Không cần đăng ký, mọi dữ liệu nằm trên trình duyệt của bạn.
      </p>

      <div className="mt-6 space-y-4">
        {GUIDES.map(({ icon: Icon, title, steps }) => (
          <Card key={title} className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          size="lg"
          className="rounded-2xl"
        >
          Bắt đầu chia tiền
        </Button>
      </div>
    </div>
  );
}
