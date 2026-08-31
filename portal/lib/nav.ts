export const BRAND_NAV = [
  { href: "/dashboard/brand", label: "總覽" },
  { href: "/dashboard/brand/kols", label: "KOL 資料庫" },
  { href: "/dashboard/brand/campaigns", label: "曝光／贊助機會" },
  { href: "/dashboard/brand/events", label: "協會活動" },
  { href: "/dashboard/brand/profile", label: "品牌基本資料" },
];

export const KOL_NAV = [
  { href: "/dashboard/kol", label: "總覽" },
  { href: "/dashboard/kol/brands", label: "品牌資料庫" },
  { href: "/dashboard/kol/campaigns", label: "合作機會申請" },
  { href: "/dashboard/kol/events", label: "協會活動" },
  { href: "/dashboard/kol/profile", label: "基本資料" },
];

export const ADMIN_NAV = [
  { href: "/dashboard/admin", label: "總覽" },
  { href: "/dashboard/admin/kols", label: "KOL管理" },
  { href: "/dashboard/admin/campaigns", label: "品牌管理" },
  { href: "/dashboard/admin/events", label: "活動管理" },
  { href: "/dashboard/admin/notifications", label: "媒合通知" },
];

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO → datetime-local input value */
export function toDatetimeLocalValue(value: string) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
