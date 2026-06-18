"use client";

import * as React from "react";
import { Receipt, Disc3 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SplitBillPanel } from "@/components/split-bill/split-bill-panel";
import { WheelPanel } from "@/components/wheel/wheel-panel";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = ["chia-tien", "quay-so"] as const;
type TabKey = (typeof TABS)[number];

export default function HomePage() {
  const [tab, setTab] = React.useState<TabKey>("chia-tien");
  // Trang là static nên không biết ?tab khi render lần đầu. Ẩn vùng tab đến khi
  // đọc xong URL rồi mới hiện đúng tab, tránh flash từ Chia tiền sang Quay số.
  const [resolved, setResolved] = React.useState(false);
  // Tăng mỗi lần điều hướng từ Chia tiền sang Quay số để gợi ý nút "Lấy danh sách".
  const [importHintKey, setImportHintKey] = React.useState(0);

  React.useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("tab");
    /* eslint-disable react-hooks/set-state-in-effect */
    if (param && TABS.includes(param as TabKey)) setTab(param as TabKey);
    setResolved(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function handleTab(value: string) {
    setTab(value as TabKey);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="w-full px-4 py-4 sm:py-6 lg:px-8">
      <div className="mx-auto mb-4 max-w-2xl text-center">
        <h1 className="text-balance text-lg font-bold tracking-tight sm:text-xl">
          Chia tiền, quay số và chốt mọi kèo trong nhóm
        </h1>
      </div>

      {resolved ? (
        <Tabs
          value={tab}
          onValueChange={handleTab}
          className="animate-in fade-in duration-300"
        >
          <TabsList className="mx-auto grid h-12 w-full max-w-xl grid-cols-2 gap-1 rounded-2xl p-1">
            <TabsTrigger value="chia-tien" className="h-full rounded-xl text-sm">
              <Receipt className="size-4" />
              Chia tiền
            </TabsTrigger>
            <TabsTrigger value="quay-so" className="h-full rounded-xl text-sm">
              <Disc3 className="size-4" />
              Quay số
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chia-tien" keepMounted className="mt-5">
            <SplitBillPanel
              onGoToWheel={() => {
                handleTab("quay-so");
                setImportHintKey((k) => k + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </TabsContent>
          <TabsContent value="quay-so" keepMounted className="mt-5">
            <WheelPanel importHintKey={importHintKey} />
          </TabsContent>
        </Tabs>
      ) : (
        <HomeSkeleton />
      )}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="mx-auto h-12 w-full max-w-xl rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-10">
        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-3 rounded-2xl border p-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-6">
          <div className="space-y-3 rounded-2xl border p-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
