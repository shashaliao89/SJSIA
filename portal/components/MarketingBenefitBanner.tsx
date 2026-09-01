"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { MarketingBenefit } from "@/lib/types";

export function MarketingBenefitBanner({ className = "" }: { className?: string }) {
  const { token } = useAuth();
  const [benefit, setBenefit] = useState<MarketingBenefit | null>(null);

  useEffect(() => {
    api<MarketingBenefit>("/api/conversations/marketing-benefit", { token })
      .then(setBenefit)
      .catch(() => setBenefit(null));
  }, [token]);

  if (!benefit?.available) return null;

  return <section className={`relative overflow-hidden rounded-3xl border border-[#CFFF1A]/45 bg-[#CFFF1A]/[0.12] p-5 shadow-[0_0_40px_rgba(207,255,26,0.08)] sm:p-7 ${className}`}>
    <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#CFFF1A]/15 blur-3xl" />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#CFFF1A] px-3 py-1 text-xs font-black text-black">團體會員專屬權益</span><span className="text-xs font-bold text-[#CFFF1A]">尚未使用</span></div>
        <h2 className="mt-3 text-xl font-black sm:text-2xl">你有 1 次「3 萬方案」客製化行銷需求</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">完成品牌目標、受眾與合作需求，協會將依招商方案協助確認活動形式、創作者與執行方向。</p>
      </div>
      <Link href="/dashboard/brand/campaigns/new" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#CFFF1A] px-5 py-3 text-sm font-black text-black transition hover:opacity-90">立即填寫 3 萬方案 →</Link>
    </div>
  </section>;
}
