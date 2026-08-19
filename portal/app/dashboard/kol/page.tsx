"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BrandProfile, Campaign, EventItem } from "@/lib/types";
import { DashboardShell, PageHeader, QuickLinkCard, StatCard } from "@/components/DashboardShell";
import { KOL_NAV, formatDate } from "@/lib/nav";

export default function KolDashboardPage() {
  const { token, user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token || user?.status !== "approved") return;
    Promise.all([
      api<{ campaigns: Campaign[] }>("/api/campaigns", { token }),
      api<{ brands: BrandProfile[] }>("/api/brands", { token }),
      api<{ events: EventItem[] }>("/api/events", { token }),
    ]).then(([campaignData, brandData, eventData]) => {
      setCampaigns(campaignData.campaigns);
      setBrands(brandData.brands);
      setEvents(eventData.events);
    }).finally(() => setLoaded(true));
  }, [token, user?.status]);

  const applications = campaigns.filter((item) => item.application_id).length;
  const approvedApplications = campaigns.filter((item) => item.application_status === "approved").length;
  const nextEvent = events.find((item) => new Date(item.event_date).getTime() >= Date.now());
  const kolName = user?.profile && "name" in user.profile ? String(user.profile.name) : "";

  return (
    <DashboardShell role="kol" title="創作者會員中心" nav={KOL_NAV}>
      <PageHeader title={`歡迎回來${kolName ? `，${kolName}` : ""}`} description="掌握品牌合作機會、媒合進度與近期會員活動。" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        <StatCard label="開放合作機會" value={loaded ? campaigns.length : "—"} tone="accent" />
        <StatCard label="已申請" value={loaded ? applications : "—"} />
        <StatCard label="已通過申請" value={loaded ? approvedApplications : "—"} />
        <StatCard label="下一場活動" value={nextEvent ? formatDate(nextEvent.event_date) : loaded ? "尚未公布" : "—"} hint={nextEvent?.title} />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <QuickLinkCard href="/dashboard/kol/campaigns" title="尋找合作機會" description="查看目前開放中的品牌案件，送出合作申請並追蹤審核狀態。" action="查看合作" />
        <QuickLinkCard href="/dashboard/kol/brands" title="品牌資料庫" description={`目前有 ${brands.length} 個公開品牌，可提交聯繫需求由協會協助媒合。`} action="瀏覽品牌" />
        <QuickLinkCard href="/dashboard/kol/events" title="協會活動" description="查看每月會員活動並完成免費報名。" action="查看活動" />
        <QuickLinkCard href="/dashboard/kol/profile" title="個人媒體資料" description="更新社群連結、受眾輪廓、合作報價與過往案例。" action="更新資料" />
      </div>
    </DashboardShell>
  );
}
