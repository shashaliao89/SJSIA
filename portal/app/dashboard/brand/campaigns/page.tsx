"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SponsorshipOpportunity } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";

function dateRange(item: SponsorshipOpportunity) {
  const format = (value: string) => value.slice(0, 10).replaceAll("-", ".");
  return `${format(item.start_date)}—${format(item.end_date)}`;
}

export default function BrandSponsorshipsPage() {
  const { token } = useAuth();
  const [opportunities, setOpportunities] = useState<SponsorshipOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const data = await api<{ opportunities: SponsorshipOpportunity[] }>("/api/sponsorships", { token });
    setOpportunities(data.opportunities);
  }

  useEffect(() => {
    load().catch(() => setOpportunities([])).finally(() => setLoading(false));
  }, [token]);

  async function expressInterest(slug: string) {
    setSubmitting(slug);
    setMessage("");
    try {
      const result = await api<{ message: string }>(`/api/sponsorships/${slug}/interest`, {
        method: "POST",
        token,
      });
      setMessage(result.message);
      await load();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "送出失敗，請稍後再試");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}>
      <PageHeader
        title="曝光／贊助機會"
        description="查看協會近期企劃與贊助提案；有興趣的品牌可先閱讀簡報，再送出合作意向。"
      />
      {message ? (
        <p className="mb-5 rounded-xl bg-[#CFFF1A]/10 px-4 py-3 text-sm font-semibold text-[#CFFF1A]">{message}</p>
      ) : null}
      {loading ? (
        <EmptyState message="載入中…" />
      ) : opportunities.length === 0 ? (
        <EmptyState message="目前尚無公開的曝光／贊助機會" />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {opportunities.map((item) => (
            <Card key={item.slug} className="flex h-full flex-col border-white/10 p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="success">開放合作</Badge>
                <p className="text-sm font-black tracking-wide text-[#CFFF1A]">{dateRange(item)}</p>
              </div>
              <h2 className="mt-5 text-xl font-black leading-snug text-white md:text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                歡迎有興趣的品牌查看完整贊助合作提案，協會將依合作需求安排後續洽談。
              </p>
              <div className="mt-8 flex flex-1 flex-col justify-end gap-3 sm:flex-row">
                <a href={item.deck_url} target="_blank" rel="noreferrer" className="sm:flex-1">
                  <Button variant="secondary" className="w-full">查看贊助合作簡報 ↗</Button>
                </a>
                <Button
                  className="sm:flex-1"
                  disabled={item.interested || submitting === item.slug}
                  onClick={() => expressInterest(item.slug)}
                >
                  {item.interested ? "已登記興趣" : submitting === item.slug ? "送出中…" : "我有興趣"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
