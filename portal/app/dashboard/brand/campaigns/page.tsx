"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, STATUS_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Campaign, CampaignApplication } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { BRAND_NAV, formatDate } from "@/lib/nav";

export default function BrandCampaignsPage() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Record<string, CampaignApplication[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadCampaigns() {
    const data = await api<{ campaigns: Campaign[] }>("/api/campaigns", { token });
    setCampaigns(data.campaigns);
  }

  useEffect(() => {
    loadCampaigns()
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function toggleApplications(campaignId: string) {
    if (expandedId === campaignId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(campaignId);
    if (applications[campaignId]) return;
    try {
      const data = await api<{ applications: CampaignApplication[] }>(
        `/api/campaigns/${campaignId}/applications`,
        { token }
      );
      setApplications((prev) => ({ ...prev, [campaignId]: data.applications }));
    } catch {
      setApplications((prev) => ({ ...prev, [campaignId]: [] }));
    }
  }

  return (
    <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}>
      <PageHeader
        title="發布合作案件"
        description="提交合作需求，待協會審核通過後 KOL 可申請；通過審核的 KOL 申請將顯示於此。"
      />
      <div className="mb-6">
        <Link href="/dashboard/brand/campaigns/new">
          <Button>新增合作案件</Button>
        </Link>
      </div>
      {loading ? (
        <EmptyState message="載入中…" />
      ) : campaigns.length === 0 ? (
        <EmptyState message="尚無合作案件，點擊上方按鈕發布第一則。" />
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-black">{c.title}</h3>
                  <p className="text-sm text-[#CFFF1A]">{c.brand_name}</p>
                  <p className="mt-2 text-sm text-gray-300">{c.content_description}</p>
                  <p className="mt-2 text-xs text-gray-500">截止：{formatDate(c.application_deadline)}</p>
                  <Badge
                    tone={
                      c.status === "approved"
                        ? "success"
                        : c.status === "pending_review"
                          ? "warning"
                          : "default"
                    }
                    className="mt-3"
                  >
                    {STATUS_LABELS[c.status] ?? c.status}
                  </Badge>
                </div>
                {c.status === "approved" ? (
                  <Button variant="secondary" onClick={() => toggleApplications(c.id)}>
                    {expandedId === c.id ? "收合申請者" : "查看通過審核的 KOL 申請"}
                  </Button>
                ) : null}
              </div>
              {expandedId === c.id ? (
                <div className="mt-4 border-t border-white/10 pt-4">
                  {(applications[c.id] ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400">尚無通過審核的 KOL 申請</p>
                  ) : (
                    <ul className="space-y-3">
                      {(applications[c.id] ?? []).map((app) => (
                        <li key={app.id} className="rounded-lg border border-white/10 p-3 text-sm">
                          <p className="font-semibold text-[#CFFF1A]">{app.kol_name ?? "KOL"}</p>
                          {app.kol_email ? <p className="text-gray-400">{app.kol_email}</p> : null}
                          {app.message ? <p className="mt-1 text-gray-300">{app.message}</p> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
