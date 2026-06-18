"use client";

import * as React from "react";

/**
 * State được đồng bộ với localStorage. Trả về giá trị mặc định trên server
 * và lần render đầu (tránh hydration mismatch), sau đó nạp giá trị đã lưu.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = React.useState<T>(initialValue);
  const [hydrated, setHydrated] = React.useState(false);

  // Đồng bộ một chiều từ localStorage (external store) vào React khi mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // bỏ qua lỗi đọc localStorage
    }
    setHydrated(true);
  }, [key]);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // bỏ qua lỗi ghi localStorage
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated];
}
