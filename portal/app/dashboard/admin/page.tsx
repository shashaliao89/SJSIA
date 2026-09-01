"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Member } from "@/lib/types";
import { DashboardShell, PageHeader, QuickLinkCard, StatCard } from "@/components/DashboardShell";
import { ADMIN_NAV } from "@/lib/nav";

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api<{ members: Member[] }>("/api/members", { token }),
      api<{ unread_count: number }>("/api/notifications", { token }),
    ])
      .then(([memberData, notificationData]) => {
        setMembers(memberData.members);
        setUnread(notificationData.unread_count);
      })
      .catch(() => setError("目前無法載入會員統計，請稍後重新整理。"));
  }, [token]);

  const summary = useMemo(() => {
    const list = members ?? [];
    return {
      total: list.length,
      kols: list.filter((member) => member.role === "kol").length,
      brands: list.filter((member) => member.role === "brand").length,
    };
  }, [members]);

  return (
    <DashboardShell role="admin" title="協會管理後台" nav={ADMIN_NAV}>
      <PageHeader title="會員總覽" description="快速掌握協會目前的會員組成，進入各管理功能處理日常營運。" />
      {error ? (
        <p className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="目前會員數" value={members ? summary.total : "—"} hint="KOL 與廠商會員合計" tone="accent" />
        <StatCard label="KOL 會員數" value={members ? summary.kols : "—"} hint="個人會員／創作者" />
        <StatCard label="廠商會員數" value={members ? summary.brands : "—"} hint="品牌方／團體會員" />
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-black">管理功能</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <QuickLinkCard href="/dashboard/admin/kols" title="KOL管理" description="管理 KOL 的 IG、粉絲數、定位標籤、合作報價與登船狀態。" action={`${summary.kols} 位 KOL`} />
          <QuickLinkCard href="/dashboard/admin/campaigns" title="品牌管理" description="查看與審核團體會員，管理品牌資料與會員狀態。" action={`${summary.brands} 個品牌`} />
          <QuickLinkCard href="/dashboard/admin/events" title="活動管理" description="新增每月活動、查看報名名單並管理出席紀錄。" />
          <QuickLinkCard href="/dashboard/admin/notifications" title="案件中心" description="處理 KOL 洽談、品牌行銷與贊助品媒合對話。" action={unread ? `${unread} 件未讀` : "目前無未讀"} />
        </div>
      </div>
    </DashboardShell>
  );
}
