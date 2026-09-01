"use client";

import Link from "next/link";
import { DashboardShell, PageHeader, QuickLinkCard } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";

export default function BrandConversationsPage() {
  return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
    <PageHeader title="我的案件" description="發起品牌行銷或贊助品需求，由協會協助規劃與媒合合作方向。" />
    <section className="mb-9">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-[#CFFF1A]">START A REQUEST</p>
          <h3 className="mt-1 text-xl font-black">發起客製化需求</h3>
        </div>
        <p className="hidden text-xs text-gray-500 sm:block">需求越具體，媒合越有效率</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/brand/campaigns/new" className="group block h-full">
          <div className="relative flex h-full min-h-40 flex-col overflow-hidden rounded-2xl border border-[#CFFF1A]/45 bg-[#CFFF1A]/[0.11] p-5 shadow-[0_0_36px_rgba(207,255,26,0.07)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#CFFF1A] md:p-6">
            <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-[#CFFF1A]/15 blur-3xl" />
            <div className="relative flex flex-1 flex-col">
              <span className="mb-3 w-fit rounded-full bg-[#CFFF1A] px-2.5 py-1 text-[10px] font-black text-black">主要合作入口</span>
              <h3 className="font-black text-white">規劃品牌行銷合作</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-300">從 3 萬、20 萬或 50 萬公版開始，調整成品牌專屬年度行銷需求。</p>
              <p className="mt-5 text-sm font-black text-[#CFFF1A]">建立行銷案件 →</p>
            </div>
          </div>
        </Link>
        <QuickLinkCard href="/dashboard/brand/sponsorships" title="發起贊助品需求" description="尋求活動贊助，或提供產品資源，交由協會協助媒合。" action="建立贊助案件" />
      </div>
    </section>
  </DashboardShell>;
}
