"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { KOL_NAV, formatDate } from "@/lib/nav";

export default function KolCampaignsPage() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [message, setMessage] = useState("");

  async function loadCampaigns() {
    const data = await api<{ campaigns: Campaign[] }>("/api/campaigns", { token });
    setCampaigns(data.campaigns);
  }

  useEffect(() => {
    loadCampaigns().catch(() => setCampaigns([]));
  }, [token]);

  async function apply(id: string) {
    setMessage("");
    try {
      await api(`/api/campaigns/${id}/apply`, {
        method: "POST",
        token,
        body: JSON.stringify({ message: "我有興趣參與此合作" }),
      });
      setMessage("合作申請已送出，待協會審核");
      await loadCampaigns();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "申請失敗");
    }
  }

  return (
    <DashboardShell role="kol" title="KOL Dashboard" nav={KOL_NAV}>
      <PageHeader title="合作機會申請" description="瀏覽協會審核通過的品牌合作案，提交申請後由管理員審核。" />
      {message ? <p className="mb-4 text-sm font-semibold text-[#CFFF1A]">{message}</p> : null}
      {campaigns.length === 0 ? (
        <EmptyState message="目前尚無開放中的合作案" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <h3 className="text-lg font-black">{c.title}</h3>
              <p className="mt-1 text-sm text-[#CFFF1A]">{c.brand_name}</p>
              <p className="mt-3 text-sm text-gray-300">{c.content_description}</p>
              {c.reward_description ? (
                <p className="mt-2 text-sm text-gray-400">報酬：{c.reward_description}</p>
              ) : null}
              <p className="mt-2 text-xs text-gray-500">截止：{formatDate(c.application_deadline)}</p>
              {c.application_id ? (
                <Badge
                  tone={
                    c.application_status === "approved"
                      ? "success"
                      : c.application_status === "rejected"
                        ? "default"
                        : "warning"
                  }
                  className="mt-4"
                >
                  {c.application_status === "approved"
                    ? "申請已通過"
                    : c.application_status === "rejected"
                      ? "申請未通過"
                      : "申請審核中"}
                </Badge>
              ) : (
                <Button className="mt-4" onClick={() => apply(c.id)}>
                  立即申請合作
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
