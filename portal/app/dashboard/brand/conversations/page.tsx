"use client";

import { DashboardShell, PageHeader, QuickLinkCard } from "@/components/DashboardShell";
import { ConversationList } from "@/components/ConversationList";
import { BRAND_NAV } from "@/lib/nav";

export default function BrandConversationsPage() {
  return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
    <PageHeader title="我的案件" description="從明確需求開始，由協會協助引薦、媒合與追蹤；所有討論與歷史紀錄都集中在這裡。" />
    <section className="mb-9">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-[#CFFF1A]">START A REQUEST</p>
          <h3 className="mt-1 text-xl font-black">發起客製化需求</h3>
        </div>
        <p className="hidden text-xs text-gray-500 sm:block">需求越具體，媒合越有效率</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <QuickLinkCard href="/dashboard/brand/campaigns?view=request" title="規劃品牌行銷合作" description="從 3 萬、20 萬或 50 萬公版開始，調整成品牌專屬年度行銷需求。" action="建立行銷案件" />
        <QuickLinkCard href="/dashboard/brand/sponsorships" title="發起贊助品需求" description="尋求活動贊助，或提供產品資源，交由協會協助媒合。" action="建立贊助案件" />
      </div>
    </section>
    <section>
      <div className="mb-4">
        <p className="text-xs font-black tracking-[0.18em] text-[#CFFF1A]">CASE HISTORY</p>
        <h3 className="mt-1 text-xl font-black">歷史紀錄與對話</h3>
      </div>
      <ConversationList />
    </section>
  </DashboardShell>;
}
