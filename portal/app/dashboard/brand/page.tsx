"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Campaign, EventItem, KolProfile } from "@/lib/types";
import { DashboardShell, PageHeader, QuickLinkCard, StatCard } from "@/components/DashboardShell";
import { BRAND_NAV, formatDate } from "@/lib/nav";

export default function BrandDashboardPage() {
  const { token, user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [kols, setKols] = useState<KolProfile[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token || user?.status !== "approved") return;
    Promise.all([
      api<{ campaigns: Campaign[] }>("/api/campaigns", { token }),
      api<{ kols: KolProfile[] }>("/api/kols", { token }),
      api<{ events: EventItem[] }>("/api/events", { token }),
    ]).then(([campaignData, kolData, eventData]) => {
      setCampaigns(campaignData.campaigns);
      setKols(kolData.kols);
      setEvents(eventData.events);
    }).finally(() => setLoaded(true));
  }, [token, user?.status]);

  const approved = campaigns.filter((item) => item.status === "approved").length;
  const pending = campaigns.filter((item) => item.status === "pending_review").length;
  const nextEvent = events.find((item) => new Date(item.event_date).getTime() >= Date.now());
  const brandName = user?.profile && "brand_name" in user.profile ? String(user.profile.brand_name) : "";

  return (
    <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
      <PageHeader title={`歡迎回來${brandName ? `，${brandName}` : ""}`} description="掌握合作案件進度、探索合適 KOL，並參與協會活動。" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        <StatCard label="可聯繫 KOL" value={loaded ? kols.length : "—"} tone="accent" />
        <StatCard label="審核中案件" value={loaded ? pending : "—"} tone={pending ? "warning" : "default"} />
        <StatCard label="已上架案件" value={loaded ? approved : "—"} />
        <StatCard label="下一場活動" value={nextEvent ? formatDate(nextEvent.event_date) : loaded ? "尚未公布" : "—"} hint={nextEvent?.title} />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <QuickLinkCard href="/dashboard/brand/kols" title="探索 KOL 資料庫" description="依粉絲級距篩選協會創作者，查看 IG 並提交合作洽談需求。" action="瀏覽 KOL" />
        <QuickLinkCard href="/dashboard/brand/campaigns" title="管理合作案件" description="發布新的合作需求，並追蹤協會審核與 KOL 申請結果。" action="查看案件" />
        <QuickLinkCard href="/dashboard/brand/events" title="協會活動" description="查看近期會員活動、完成報名或申請品牌露出。" action="查看活動" />
        <QuickLinkCard href="/dashboard/brand/profile" title="品牌基本資料" description="保持品牌介紹與聯絡資訊完整，提升媒合效率。" action="編輯資料" />
      </div>
    </DashboardShell>
  );
}
