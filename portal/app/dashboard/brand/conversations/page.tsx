"use client";

import Link from "next/link";
import { DashboardShell, PageHeader } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";

const REQUEST_TYPES = [
  {
    href: "/dashboard/brand/campaigns/new",
    eyebrow: "品牌行銷",
    title: "規劃品牌行銷合作",
    description: "依品牌目標與預算，建立客製化的創作者合作或年度行銷需求。",
    action: "開始規劃",
    featured: true,
  },
  {
    href: "/dashboard/brand/sponsorships",
    eyebrow: "資源媒合",
    title: "發起贊助品需求",
    description: "尋求活動贊助或提供產品資源，由協會協助媒合適合的合作對象。",
    action: "建立需求",
    featured: false,
  },
];

export default function BrandConversationsPage() {
  return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
    <PageHeader title="我的案件" description="選擇需求類型，協會將協助規劃並媒合合適資源。" />
    <section className="grid gap-4 md:grid-cols-2">
      {REQUEST_TYPES.map((item) => <Link key={item.href} href={item.href} className="group block h-full">
        <article className={`relative flex h-full min-h-52 flex-col overflow-hidden rounded-3xl border p-6 transition duration-200 group-hover:-translate-y-0.5 sm:p-7 ${item.featured ? "border-[#CFFF1A]/50 bg-[#CFFF1A]/[0.09] group-hover:border-[#CFFF1A]" : "border-white/10 bg-white/[0.03] group-hover:border-white/25"}`}>
          {item.featured ? <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#CFFF1A]/15 blur-3xl" /> : null}
          <div className="relative flex h-full flex-col">
            <p className={`text-xs font-black tracking-[0.12em] ${item.featured ? "text-[#CFFF1A]" : "text-gray-500"}`}>{item.eyebrow}</p>
            <h2 className="mt-3 text-xl font-black text-white">{item.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-7 text-gray-400">{item.description}</p>
            <span className={`mt-7 inline-flex items-center gap-2 text-sm font-black ${item.featured ? "text-[#CFFF1A]" : "text-white"}`}>{item.action}<span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span>
          </div>
        </article>
      </Link>)}
    </section>
  </DashboardShell>;
}
