"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation, EventItem, KolProfile } from "@/lib/types";
import { DashboardShell, PageHeader, QuickLinkCard, StatCard, Card } from "@/components/DashboardShell";
import { BRAND_NAV, formatDate } from "@/lib/nav";

export default function BrandDashboardPage() {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [kols, setKols] = useState<KolProfile[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token || user?.status !== "approved") return;
    Promise.all([
      api<{ conversations: Conversation[] }>("/api/conversations?limit=50", { token }),
      api<{ kols: KolProfile[] }>("/api/kols", { token }),
      api<{ events: EventItem[] }>("/api/events", { token }),
    ]).then(([conversationData, kolData, eventData]) => {
      setConversations(conversationData.conversations);
      setKols(kolData.kols);
      setEvents(eventData.events);
    }).finally(() => setLoaded(true));
  }, [token, user?.status]);

  const inProgress = conversations.filter((item) => item.status === "in_progress").length;
  const unread = conversations.reduce((total, item) => total + (item.unread_count ?? 0), 0);
  const nextEvent = events.find((item) => new Date(item.event_date).getTime() >= Date.now());
  const brandName = user?.profile && "brand_name" in user.profile ? String(user.profile.brand_name) : "";

  if (user?.status !== "approved") {
    return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}><PageHeader title={`帳號審核中${brandName ? `，${brandName}` : ""}`} description="協會確認團體會員資格後，將開放 KOL 資料庫、商業需求與聊天室功能。"/><Card className="border-amber-400/25 bg-amber-400/[0.06]"><h2 className="text-lg font-black text-amber-200">目前狀態：待管理員審核</h2><p className="mt-2 text-sm leading-relaxed text-gray-300">你可以先完成品牌基本資料，讓協會更快了解品牌與合作方向。</p><div className="mt-5"><QuickLinkCard href="/dashboard/brand/profile" title="完善品牌基本資料" description="補充品牌介紹與聯絡方式。" action="前往編輯"/></div></Card></DashboardShell>;
  }

  return (
    <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
      <PageHeader title={`歡迎回來${brandName ? `，${brandName}` : ""}`} description="探索商業合作機會、認識合適 KOL，並由協會協助規劃品牌需求。" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        <StatCard label="可聯繫 KOL" value={loaded ? kols.length : "—"} tone="accent" />
        <StatCard label="進行中案件" value={loaded ? inProgress : "—"} tone={inProgress ? "warning" : "default"} />
        <StatCard label="未讀訊息" value={loaded ? unread : "—"} tone={unread ? "warning" : "default"} />
        <StatCard label="下一場活動" value={nextEvent ? formatDate(nextEvent.event_date) : loaded ? "尚未公布" : "—"} hint={nextEvent?.title} />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <QuickLinkCard href="/dashboard/brand/kols" title="探索 KOL 資料庫" description="依粉絲級距篩選協會創作者，查看 IG 並提交合作洽談需求。" action="瀏覽 KOL" />
        <QuickLinkCard href="/dashboard/brand/campaigns" title="商業合作機會" description="查看協會提案，或提交客製化年度行銷需求。" action="查看機會" />
        <QuickLinkCard href="/dashboard/brand/sponsorships" title="贊助品媒合" description="尋求活動贊助品，或提供品牌產品資源。" action="建立案件" />
        <QuickLinkCard href="/dashboard/brand/conversations" title="我的案件" description="查看所有需求紀錄與協會客服對話。" action="查看對話" />
        <QuickLinkCard href="/dashboard/brand/events" title="協會活動" description="查看近期會員活動、完成報名或申請品牌露出。" action="查看活動" />
        <QuickLinkCard href="/dashboard/brand/profile" title="品牌基本資料" description="保持品牌介紹與聯絡資訊完整，提升媒合效率。" action="編輯資料" />
      </div>
    </DashboardShell>
  );
}
