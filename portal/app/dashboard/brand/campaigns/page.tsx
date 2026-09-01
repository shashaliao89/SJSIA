"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation, SponsorshipOpportunity } from "@/lib/types";
import { Badge, Button, Card, DashboardShell, EmptyState, PageHeader } from "@/components/DashboardShell";
import { ConversationModal } from "@/components/ConversationModal";
import { BRAND_NAV } from "@/lib/nav";

const formatDateRange = (item: SponsorshipOpportunity) => {
  const format = (value: string) => value.slice(0, 10).replaceAll("-", ".");
  return `${format(item.start_date)}—${format(item.end_date)}`;
};

export default function BrandCommercialPage() {
  const { token } = useAuth();
  const [opportunities, setOpportunities] = useState<SponsorshipOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const load = async () => {
    const data = await api<{ opportunities: SponsorshipOpportunity[] }>("/api/sponsorships", { token });
    setOpportunities(data.opportunities);
  };

  useEffect(() => {
    load().catch(() => setOpportunities([])).finally(() => setLoading(false));
  }, [token]);

  async function toggleInterest(item: SponsorshipOpportunity) {
    setSubmitting(true);
    try {
      if (item.interested) {
        await api(`/api/sponsorships/${item.slug}/interest`, { method: "DELETE", token });
        await load();
      } else {
        const data = await api<{ conversation_id: string }>(`/api/sponsorships/${item.slug}/interest`, {
          method: "POST",
          token,
        });
        await load();
        setConversation({ id: data.conversation_id, title: `商業合作：${item.title}` } as Conversation);
      }
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "操作失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
    <PageHeader title="商業合作機會" description="查看協會目前開放的商業合作提案；先閱讀完整簡報，再送出合作意向與協會進一步討論。" />
    {loading ? <EmptyState message="載入商業合作提案中…" /> : opportunities.length === 0 ? <EmptyState message="目前尚無公開商業合作提案" /> : (
      <div className="grid gap-5 xl:grid-cols-2">
        {opportunities.map((item) => <Card key={item.slug} className="flex h-full flex-col p-6 md:p-8">
          <div className="flex items-center justify-between gap-3"><Badge tone="success">開放合作</Badge><p className="text-sm font-black text-[#CFFF1A]">{formatDateRange(item)}</p></div>
          <h2 className="mt-5 text-xl font-black leading-snug md:text-2xl">{item.title}</h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-400">查看提案內容、合作資源與曝光規劃，確認適合品牌後再送出意向。</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href={item.deck_url} target="_blank" rel="noreferrer" className="flex-1"><Button variant="secondary" className="w-full">查看合作提案簡報 ↗</Button></a>
            <Button className="flex-1" variant={item.interested ? "secondary" : "primary"} disabled={submitting} onClick={() => toggleInterest(item)}>{item.interested ? "取消興趣" : "我有興趣"}</Button>
          </div>
        </Card>)}
      </div>
    )}
    {conversation ? <ConversationModal conversation={conversation} onClose={() => setConversation(null)} /> : null}
  </DashboardShell>;
}
