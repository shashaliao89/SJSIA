"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, STATUS_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { ADMIN_NAV, formatDate } from "@/lib/nav";

export default function AdminCampaignsPage() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await api<{ campaigns: Campaign[] }>("/api/campaigns", { token });
    setCampaigns(data.campaigns);
  }

  useEffect(() => {
    load().catch(() => setCampaigns([]));
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    try {
      await api(`/api/campaigns/${editing.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          title: fd.get("title"),
          brand_name: fd.get("brand_name"),
          product_service_intro: fd.get("product_service_intro"),
          budget: fd.get("budget"),
          content_description: fd.get("content_description"),
          reward_description: fd.get("reward_description"),
          application_deadline: fd.get("application_deadline") || null,
          status: fd.get("status"),
        }),
      });
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "更新失敗");
    }
  }

  async function quickApprove(id: string) {
    const c = campaigns.find((x) => x.id === id);
    if (!c) return;
    await api(`/api/campaigns/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify({ ...c, status: "approved" }),
    });
    await load();
  }

  return (
    <DashboardShell role="admin" title="Admin Dashboard" nav={ADMIN_NAV}>
      <PageHeader title="品牌案件管理" description="審核品牌合作需求、編輯內容與狀態。" />
      {campaigns.length === 0 ? (
        <EmptyState message="尚無合作案件" />
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-black">{c.title}</h3>
                  <p className="text-sm text-[#CFFF1A]">{c.brand_name}</p>
                  <p className="mt-2 text-sm text-gray-300">{c.content_description}</p>
                  <Badge tone={c.status === "approved" ? "success" : c.status === "pending_review" ? "warning" : "default"} className="mt-3">
                    {STATUS_LABELS[c.status] ?? c.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.status === "pending_review" ? (
                    <Button onClick={() => quickApprove(c.id)}>核准上架</Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditing(c);
                      setShowForm(true);
                    }}
                  >
                    編輯
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && editing ? (
        <Card className="mt-8">
          <h3 className="mb-4 font-black">編輯案件</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title">合作主題</label>
              <input id="title" name="title" required defaultValue={editing.title} />
            </div>
            <div>
              <label htmlFor="brand_name">品牌名稱</label>
              <input id="brand_name" name="brand_name" required defaultValue={editing.brand_name} />
            </div>
            <div>
              <label htmlFor="product_service_intro">產品介紹</label>
              <textarea id="product_service_intro" name="product_service_intro" rows={2} defaultValue={editing.product_service_intro} required />
            </div>
            <div>
              <label htmlFor="budget">預算</label>
              <input id="budget" name="budget" defaultValue={editing.budget ?? ""} />
            </div>
            <div>
              <label htmlFor="content_description">合作內容</label>
              <textarea id="content_description" name="content_description" rows={3} defaultValue={editing.content_description} required />
            </div>
            <div>
              <label htmlFor="reward_description">報酬說明</label>
              <textarea id="reward_description" name="reward_description" rows={2} defaultValue={editing.reward_description ?? ""} />
            </div>
            <div>
              <label htmlFor="application_deadline">截止日期</label>
              <input id="application_deadline" name="application_deadline" type="date" defaultValue={editing.application_deadline?.slice(0, 10) ?? ""} />
            </div>
            <div>
              <label htmlFor="status">狀態</label>
              <select id="status" name="status" defaultValue={editing.status}>
                <option value="pending_review">待協會審核</option>
                <option value="approved">已通過</option>
                <option value="rejected">已拒絕</option>
                <option value="closed">已結束</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">儲存</Button>
              <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditing(null); }}>
                取消
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </DashboardShell>
  );
}
