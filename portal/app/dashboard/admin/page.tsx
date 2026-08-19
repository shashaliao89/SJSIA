"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Campaign, EventItem, KolProfile, Member } from "@/lib/types";
import { DashboardShell, PageHeader, QuickLinkCard, StatCard } from "@/components/DashboardShell";
import { ADMIN_NAV } from "@/lib/nav";

interface AdminSummary {
  members: Member[];
  campaigns: Campaign[];
  kols: KolProfile[];
  events: EventItem[];
  unread: number;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api<{ members: Member[] }>("/api/members", { token }),
      api<{ campaigns: Campaign[] }>("/api/campaigns", { token }),
      api<{ kols: KolProfile[] }>("/api/kols", { token }),
      api<{ events: EventItem[] }>("/api/events", { token }),
      api<{ unread_count: number }>("/api/notifications", { token }),
    ])
      .then(([members, campaigns, kols, events, notifications]) => {
        setSummary({ members: members.members, campaigns: campaigns.campaigns, kols: kols.kols, events: events.events, unread: notifications.unread_count });
      })
      .catch(() => setError("目前無法載入營運摘要，請稍後重新整理。"));
  }, [token]);

  const pendingMembers = summary?.members.filter((item) => item.status === "pending").length ?? 0;
  const pendingCampaigns = summary?.campaigns.filter((item) => item.status === "pending_review").length ?? 0;
  const upcomingEvents = summary?.events.filter((item) => new Date(item.event_date).getTime() >= Date.now()).length ?? 0;

  return (
    <DashboardShell role="admin" title="協會管理後台" nav={ADMIN_NAV}>
      <PageHeader title="營運總覽" description="掌握會員審核、媒合需求、合作案件與近期活動。" />
      {error ? <p className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-300">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        <StatCard label="待審核會員" value={summary ? pendingMembers : "—"} tone={pendingMembers ? "warning" : "default"} />
        <StatCard label="待審核案件" value={summary ? pendingCampaigns : "—"} tone={pendingCampaigns ? "warning" : "default"} />
        <StatCard label="未處理通知" value={summary ? summary.unread : "—"} tone={summary?.unread ? "accent" : "default"} />
        <StatCard label="KOL 資料" value={summary ? summary.kols.length : "—"} hint="協會資料庫總數" />
        <StatCard label="近期活動" value={summary ? upcomingEvents : "—"} hint="尚未舉辦的活動" />
      </div>
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-black">優先處理</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <QuickLinkCard href="/dashboard/admin/notifications" title="媒合通知" description="處理品牌與 KOL 的聯繫需求，以及待審核的合作申請。" action={`${summary?.unread ?? 0} 件待處理`} />
          <QuickLinkCard href="/dashboard/admin/members" title="會員審核" description="審核新會員、管理會員狀態與效期。" action={`${pendingMembers} 位待審核`} />
          <QuickLinkCard href="/dashboard/admin/campaigns" title="品牌合作案件" description="審核品牌發布內容，通過後開放 KOL 申請。" action={`${pendingCampaigns} 件待審核`} />
          <QuickLinkCard href="/dashboard/admin/kols" title="KOL 資料管理" description="維護 IG、粉絲數、合作報價與登船狀態。" />
          <QuickLinkCard href="/dashboard/admin/events" title="活動管理" description="新增活動、查看報名名單與管理出席紀錄。" />
        </div>
      </div>
    </DashboardShell>
  );
}
