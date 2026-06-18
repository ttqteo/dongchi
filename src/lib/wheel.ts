/** Bảng màu cho các nan của vòng quay (xen kẽ, tương phản tốt cả light/dark). */
export const WHEEL_COLORS = [
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export function wheelColor(index: number): string {
  return WHEEL_COLORS[index % WHEEL_COLORS.length];
}

/** Toạ độ trên đường tròn, đo theo chiều kim đồng hồ từ đỉnh (12 giờ). */
export function pointOnCircle(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
}

/** Path SVG cho một nan quạt từ a0 đến a1 (độ, clockwise từ đỉnh). */
export function slicePath(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
): string {
  const [x0, y0] = pointOnCircle(cx, cy, r, a0);
  const [x1, y1] = pointOnCircle(cx, cy, r, a1);
  const largeArc = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}

/**
 * Tính góc quay cuối cùng (luôn tăng để quay tới) sao cho nan `winner`
 * dừng đúng ở đỉnh, sau ít nhất `minSpins` vòng.
 */
export function targetRotation(
  current: number,
  winner: number,
  total: number,
  minSpins = 5,
): number {
  const seg = 360 / total;
  const center = winner * seg + seg / 2;
  const targetMod = (360 - center) % 360;
  const currentMod = ((current % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta <= 0) delta += 360;
  return current + minSpins * 360 + delta;
}
