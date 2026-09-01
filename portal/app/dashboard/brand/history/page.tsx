"use client";

import { ConversationList } from "@/components/ConversationList";
import { DashboardShell, PageHeader } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";

export default function BrandCaseHistoryPage() {
  return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
    <PageHeader title="歷史紀錄" description="集中查看已結案或已撤回的合作需求、創作者洽談與協會客服對話。" />
    <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
      <div className="mb-5 border-b border-white/10 pb-5">
        <p className="text-xs font-black tracking-[0.18em] text-[#CFFF1A]">CASE ARCHIVE</p>
        <h2 className="mt-2 text-xl font-black">過往案件與完整對話</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">歷史資料會持續保留，點擊任一案件即可重新查看處理過程與訊息紀錄。</p>
      </div>
      <ConversationList mode="history" compact emptyMessage="目前尚無歷史紀錄" />
    </section>
  </DashboardShell>;
}
