"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api, COLLAB_TYPES, CONTENT_TYPES } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { DashboardShell, PageHeader, Card, Button } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";

export default function BrandCampaignNewPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const profile = user?.profile as { brand_name?: string } | undefined;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const targetTypes = CONTENT_TYPES.filter((t) => fd.get(`type_${t}`) === "on");

    try {
      await api("/api/campaigns", {
        method: "POST",
        token,
        body: JSON.stringify({
          title: fd.get("title"),
          brand_name: fd.get("brand_name"),
          product_service_intro: fd.get("product_service_intro"),
          budget: fd.get("budget"),
          target_kol_types: targetTypes,
          event_date: fd.get("event_date") || null,
          content_description: fd.get("content_description"),
          reward_description: fd.get("reward_description") || null,
          application_deadline: fd.get("application_deadline") || null,
        }),
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/brand/campaigns"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "提交失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}>
      <PageHeader
        title="發布合作案件"
        description="提交後狀態為「待協會審核」，通過後 KOL 方可申請。"
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title">合作主題</label>
            <input id="title" name="title" required placeholder="例：夏季新品開箱合作" />
          </div>
          <div>
            <label htmlFor="brand_name">品牌名稱</label>
            <input
              id="brand_name"
              name="brand_name"
              required
              defaultValue={profile?.brand_name ?? ""}
            />
          </div>
          <div>
            <label htmlFor="product_service_intro">產品 / 服務介紹</label>
            <textarea id="product_service_intro" name="product_service_intro" rows={3} required />
          </div>
          <div>
            <label htmlFor="budget">合作預算</label>
            <input id="budget" name="budget" placeholder="例：NT$ 50,000 或 互惠" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-300">希望合作的 KOL 類型</p>
            <div className="flex flex-wrap gap-3">
              {CONTENT_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm font-normal text-gray-300">
                  <input type="checkbox" name={`type_${t}`} className="w-auto" />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="event_date">預計活動時間</label>
              <input id="event_date" name="event_date" type="date" />
            </div>
            <div>
              <label htmlFor="application_deadline">申請截止日期</label>
              <input id="application_deadline" name="application_deadline" type="date" />
            </div>
          </div>
          <div>
            <label htmlFor="content_description">合作內容說明</label>
            <textarea id="content_description" name="content_description" rows={4} required />
          </div>
          <div>
            <label htmlFor="reward_description">報酬 / 互惠內容</label>
            <textarea id="reward_description" name="reward_description" rows={2} />
          </div>
          {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
          {success ? (
            <p className="text-sm font-semibold text-[#CFFF1A]">已提交，待協會審核中…</p>
          ) : null}
          <Button type="submit" disabled={submitting} className="w-full md:w-auto">
            {submitting ? "提交中…" : "提交合作需求"}
          </Button>
        </form>
      </Card>
    </DashboardShell>
  );
}
