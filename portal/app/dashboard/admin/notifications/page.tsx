"use client";

import { useEffect, useState } from "react";
import { ApiError, api, STATUS_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ContactRequest, CampaignApplication } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { ADMIN_NAV, formatDateTime } from "@/lib/nav";

export default function AdminNotificationsPage() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api<{
      contact_requests: ContactRequest[];
      pending_applications: CampaignApplication[];
    }>("/api/notifications", { token });
    setContacts(data.contact_requests);
    setApplications(data.pending_applications);
  }

  useEffect(() => {
    load()
      .catch(() => {
        setContacts([]);
        setApplications([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function markContactRead(id: string) {
    await api(`/api/notifications/contact/${id}/read`, { method: "PATCH", token });
    await load();
  }

  async function markContactHandled(id: string) {
    await api(`/api/notifications/contact/${id}/handled`, { method: "PATCH", token });
    await load();
  }

  async function reviewApplication(id: string, status: "approved" | "rejected") {
    try {
      await api(`/api/campaigns/applications/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "審核失敗");
    }
  }

  const pendingContacts = contacts.filter((c) => c.status === "pending");

  return (
    <DashboardShell role="admin" title="Admin Dashboard" nav={ADMIN_NAV}>
      <PageHeader
        title="媒合通知"
        description="品牌與 KOL 的洽談申請，以及 KOL 合作案件申請待審核項目。"
      />
      {loading ? (
        <EmptyState message="載入中…" />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-black text-[#CFFF1A]">
              洽談申請 {pendingContacts.length > 0 ? `(${pendingContacts.length})` : ""}
            </h2>
            {pendingContacts.length === 0 ? (
              <EmptyState message="目前無待處理的洽談申請" />
            ) : (
              <div className="space-y-4">
                {pendingContacts.map((c) => (
                  <Card key={c.id} className={!c.admin_read ? "border-[#CFFF1A]/40" : undefined}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <Badge tone={c.target_type === "kol" ? "warning" : "success"} className="mb-2">
                          {c.target_type === "kol" ? "品牌 → KOL" : "KOL → 品牌"}
                        </Badge>
                        <p className="font-semibold">
                          {c.from_role === "brand"
                            ? `${c.from_brand_name ?? c.from_email} 想聯繫 ${c.kol_name ?? "KOL"}`
                            : `${c.from_kol_name ?? c.from_email} 想聯繫 ${c.target_brand_name ?? "品牌"}`}
                        </p>
                        <p className="mt-1 text-sm text-gray-400">{c.from_email}</p>
                        {c.message ? <p className="mt-2 text-sm text-gray-300">{c.message}</p> : null}
                        <p className="mt-2 text-xs text-gray-500">{formatDateTime(c.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!c.admin_read ? (
                          <Button variant="secondary" onClick={() => markContactRead(c.id)}>
                            標記已讀
                          </Button>
                        ) : null}
                        <Button onClick={() => markContactHandled(c.id)}>標記已處理</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-black text-[#CFFF1A]">
              KOL 合作申請待審 {applications.length > 0 ? `(${applications.length})` : ""}
            </h2>
            {applications.length === 0 ? (
              <EmptyState message="目前無待審核的合作申請" />
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-[#CFFF1A]">
                          {app.kol_name ?? app.kol_email} 申請「{app.campaign_title}」
                        </p>
                        <p className="text-sm text-gray-400">{app.brand_name}</p>
                        {app.message ? <p className="mt-2 text-sm text-gray-300">{app.message}</p> : null}
                        <Badge tone="warning" className="mt-2">
                          {STATUS_LABELS[app.status] ?? app.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => reviewApplication(app.id, "approved")}>核准</Button>
                        <Button variant="secondary" onClick={() => reviewApplication(app.id, "rejected")}>
                          拒絕
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
