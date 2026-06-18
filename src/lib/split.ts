export interface GrabSplitResult {
  /** Số tiền mỗi người trả (đã làm tròn lên bội số của roundTo) */
  perPerson: number;
  /** Tổng sau khi làm tròn (perPerson * số người) */
  roundedTotal: number;
  /** Phần dư so với tổng gốc (roundedTotal - total). >= 0 */
  surplus: number;
  /** Số tiền trung bình thực tế chưa làm tròn */
  exact: number;
}

/**
 * Chia đều một hóa đơn cho nhiều người, làm tròn LÊN tới bội số `roundTo`
 * để con số dễ chuyển khoản (mặc định 1.000đ).
 */
export function splitGrab(
  total: number,
  people: number,
  roundTo = 1000,
): GrabSplitResult | null {
  if (total <= 0 || people <= 0) return null;

  const exact = total / people;
  const perPerson =
    roundTo > 0 ? Math.ceil(exact / roundTo) * roundTo : Math.ceil(exact);
  const roundedTotal = perPerson * people;

  return {
    perPerson,
    roundedTotal,
    surplus: roundedTotal - total,
    exact,
  };
}

export interface BillRow {
  id: string;
  /** Tên người hoặc tên món của người đó */
  name: string;
  /** Giá món (VND) */
  price: number;
}

export interface ItemizedLine {
  name: string;
  /** Các món của người này (đã gộp các dòng trùng tên) */
  items: number[];
  /** Tổng tiền các món */
  price: number;
  /** Phần phí áp dụng được chia cho người này */
  feeShare: number;
  /** Tạm tính = giá + phí chia */
  subtotal: number;
  /** Phần khuyến mãi được chia (số dương, sẽ trừ ra) */
  discountShare: number;
  /** Thành tiền = tạm tính − khuyến mãi chia */
  total: number;
}

export interface ItemizedResult {
  lines: ItemizedLine[];
  totals: {
    price: number;
    feeShare: number;
    subtotal: number;
    discountShare: number;
    total: number;
  };
}

/**
 * Chia bill theo món: mỗi dòng là một người (hoặc món của người đó).
 * Phí áp dụng và khuyến mãi được chia ĐỀU cho `people` người.
 */
export function splitItemized(
  rows: BillRow[],
  fee: number,
  discount: number,
  people: number,
): ItemizedResult | null {
  const valid = rows.filter((r) => r.name.trim() !== "" || r.price > 0);
  if (valid.length === 0) return null;

  // Gộp các dòng trùng tên thành một người (so khớp không phân biệt hoa/thường).
  // Dòng không có tên thì mỗi dòng là một người ẩn danh riêng.
  const groups = new Map<string, { name: string; items: number[] }>();
  valid.forEach((r, idx) => {
    const trimmed = r.name.trim();
    const key = trimmed ? trimmed.toLowerCase() : `__anon_${idx}`;
    const group = groups.get(key) ?? {
      name: trimmed || "Người ẩn danh",
      items: [],
    };
    group.items.push(r.price);
    groups.set(key, group);
  });
  const people_ = [...groups.values()];

  const divisor = people > 0 ? people : people_.length;
  const feeShare = Math.round(Math.max(0, fee) / divisor);
  const discountShare = Math.round(Math.max(0, discount) / divisor);

  const lines: ItemizedLine[] = people_.map((p) => {
    const price = p.items.reduce((s, v) => s + v, 0);
    const subtotal = price + feeShare;
    return {
      name: p.name,
      items: p.items,
      price,
      feeShare,
      subtotal,
      discountShare,
      total: subtotal - discountShare,
    };
  });

  const totals = lines.reduce(
    (acc, l) => ({
      price: acc.price + l.price,
      feeShare: acc.feeShare + l.feeShare,
      subtotal: acc.subtotal + l.subtotal,
      discountShare: acc.discountShare + l.discountShare,
      total: acc.total + l.total,
    }),
    { price: 0, feeShare: 0, subtotal: 0, discountShare: 0, total: 0 },
  );

  return { lines, totals };
}

