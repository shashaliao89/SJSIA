"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation, EventItem, KolProfile } from "@/lib/types";
import { DashboardShell, PageHeader, QuickLinkCard, StatCard, Card } from "@/components/DashboardShell";
import { BRAND_NAV, formatDate } from "@/lib/nav";
import { MarketingBenefitBanner } from "@/components/MarketingBenefitBanner";

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
  const closed = conversations.filter((item) => item.status === "closed").length;
  const unread = conversations.reduce((total, item) => total + (item.unread_count ?? 0), 0);
  const connectedCreators = kols.filter((item) => item.contacted).length;
  const nextEvent = events.find((item) => new Date(item.event_date).getTime() >= Date.now());
  const brandName = user?.profile && "brand_name" in user.profile ? String(user.profile.brand_name) : "";

  if (user?.status !== "approved") {
    return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}><PageHeader title={`帳號審核中${brandName ? `，${brandName}` : ""}`} description="協會確認團體會員資格後，將開放創作者資料庫、商業需求與聊天室功能。"/><Card className="border-amber-400/25 bg-amber-400/[0.06]"><h2 className="text-lg font-black text-amber-200">目前狀態：待管理員審核</h2><p className="mt-2 text-sm leading-relaxed text-gray-300">你可以先完成品牌基本資料，讓協會更快了解品牌與合作方向。</p><div className="mt-5"><QuickLinkCard href="/dashboard/brand/profile" title="完善品牌基本資料" description="補充品牌介紹與聯絡方式。" action="前往編輯"/></div></Card></DashboardShell>;
  }

  return (
    <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
      <PageHeader title={`歡迎回來${brandName ? `，${brandName}` : ""}`} description="每月提出明確需求、建立可信任的創作者關係，並持續追蹤合作成果。" />
      <MarketingBenefitBanner className="mb-8" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        <StatCard label="已建立創作者連結" value={loaded ? connectedCreators : "—"} hint={`共 ${kols.length} 位協會創作者`} tone="accent" />
        <StatCard label="進行中案件" value={loaded ? inProgress : "—"} tone={inProgress ? "warning" : "default"} />
        <StatCard label="已完成案件" value={loaded ? closed : "—"} hint="持續累積合作紀錄" />
        <StatCard label="待回覆訊息" value={loaded ? unread : "—"} hint={nextEvent ? `下次活動 ${formatDate(nextEvent.event_date)}` : "本月活動尚未公布"} tone={unread ? "warning" : "default"} />
      </div>

      <section className="mt-8 rounded-3xl border border-[#CFFF1A]/20 bg-gradient-to-br from-[#CFFF1A]/10 via-white/[0.025] to-transparent p-5 sm:p-7">
        <div className="max-w-2xl">
          <p className="text-xs font-black tracking-[0.18em] text-[#CFFF1A]">MONTHLY MEMBER RHYTHM</p>
          <h3 className="mt-2 text-xl font-black sm:text-2xl">每月合作節奏</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">固定參與、明確提出需求、由協會建立引薦，再回到案件追蹤成果。讓一次認識逐步累積成可信任的長期合作。</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["01", "提出需求", "說清楚目標、對象與預算"],
            ["02", "找到對的人", "從創作者資料庫建立名單"],
            ["03", "協會協助引薦", "透過案件對話確認合作方向"],
            ["04", "參與並追蹤", "每月交流、回報進度與成果"],
          ].map(([step, title, description]) => <div key={step} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs font-black text-[#CFFF1A]">{step}</p><p className="mt-2 font-black">{title}</p><p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p></div>)}
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <QuickLinkCard href="/dashboard/brand/conversations" title="我的案件" description="發起客製化行銷或贊助需求，集中追蹤進行中的案件與協會對話。" action={unread ? `${unread} 則訊息待回覆` : "發起或查看案件"} />
        <QuickLinkCard href="/dashboard/brand/history" title="歷史紀錄" description="查看已結案或已撤回的合作需求、創作者洽談與完整訊息紀錄。" action="查看過往案件" />
        <QuickLinkCard href="/dashboard/brand/campaigns" title="商業合作機會" description="查看協會主動策劃、目前開放中的品牌合作提案。" action="查看機會" />
        <QuickLinkCard href="/dashboard/brand/kols" title="創作者資料庫" description="依粉絲規模與定位篩選協會創作者，查看 IG 並發起合作洽談。" action="探索創作者" />
        <QuickLinkCard href="/dashboard/brand/events" title="每月協會活動" description="透過固定交流增加能見度、建立關係，並申請品牌露出。" action={nextEvent ? `下一場：${formatDate(nextEvent.event_date)}` : "查看活動"} />
        <QuickLinkCard href="/dashboard/brand/profile" title="品牌基本資料" description="保持品牌介紹與聯絡資訊完整，提升媒合效率。" action="編輯資料" />
      </div>
    </DashboardShell>
  );
}
