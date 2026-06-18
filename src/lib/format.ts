/** Định dạng số tiền VND: 50000 -> "50.000đ" */
export function formatVND(amount: number): string {
  return `${formatNumber(Math.round(amount))}đ`;
}

/** Định dạng số với dấu chấm ngăn nghìn: 50000 -> "50.000" */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("vi-VN").format(value);
}

/** Lấy chữ số từ chuỗi nhập tự do: "50.000đ" -> 50000 */
export function parseNumber(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
