"use client";

import * as React from "react";

/**
 * State đồng bộ với localStorage. Đọc giá trị đã lưu NGAY ở lần render đầu
 * (chỉ chạy phía client) nên không bị "nháy" từ giá trị mặc định sang giá trị
 * đã lưu. Các component dùng hook này chỉ render sau khi trang đã mount.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // bỏ qua lỗi ghi localStorage
    }
  }, [key, value]);

  return [value, setValue];
}
