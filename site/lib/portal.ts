/** 會員後台 Portal 網址（本機預設 3001，正式環境於 Vercel 設定 NEXT_PUBLIC_PORTAL_URL） */
export function getPortalUrl(path = "/login") {
  const base = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";
  const normalized = base.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${normalized}${suffix}`;
}
