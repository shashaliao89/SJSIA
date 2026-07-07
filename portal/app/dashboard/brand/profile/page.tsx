"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BrandProfile } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";

export default function BrandProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ profile: BrandProfile | null }>("/api/brands/profile", { token })
      .then((d) => setProfile(d.profile))
      .catch(() => setProfile(null));
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const data = await api<{ profile: BrandProfile }>("/api/brands/profile", {
        method: "PUT",
        token,
        body: JSON.stringify({
          brand_name: fd.get("brand_name"),
          company_intro: fd.get("company_intro") || null,
          contact_name: fd.get("contact_name") || null,
          contact_phone: fd.get("contact_phone") || null,
          open_to_contact: fd.get("open_to_contact") === "on",
          is_public: fd.get("is_public") === "on",
        }),
      });
      setProfile(data.profile);
      setMessage("已儲存");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "儲存失敗");
    }
  }

  if (!profile) {
    return (
      <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}>
        <PageHeader title="品牌基本資料" />
        <Card><p className="text-gray-400">載入中…</p></Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}>
      <PageHeader
        title="品牌基本資料"
        description="維護品牌公開資訊，供 KOL 在品牌資料庫瀏覽。"
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="brand_name">品牌名稱</label>
            <input id="brand_name" name="brand_name" defaultValue={profile.brand_name} required />
          </div>
          <div>
            <label htmlFor="company_intro">公司 / 品牌介紹</label>
            <textarea
              id="company_intro"
              name="company_intro"
              rows={4}
              defaultValue={profile.company_intro ?? ""}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="contact_name">聯絡人姓名</label>
              <input
                id="contact_name"
                name="contact_name"
                defaultValue={profile.contact_name ?? ""}
              />
            </div>
            <div>
              <label htmlFor="contact_phone">聯絡電話</label>
              <input
                id="contact_phone"
                name="contact_phone"
                defaultValue={profile.contact_phone ?? ""}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-normal text-gray-300">
            <input
              type="checkbox"
              name="is_public"
              className="w-auto"
              defaultChecked={profile.is_public}
            />
            公開顯示於品牌資料庫
          </label>
          <label className="flex items-center gap-2 text-sm font-normal text-gray-300">
            <input
              type="checkbox"
              name="open_to_contact"
              className="w-auto"
              defaultChecked={profile.open_to_contact}
            />
            開放 KOL 聯繫
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {message ? <p className="text-sm text-[#CFFF1A]">{message}</p> : null}
          <Button type="submit">儲存資料</Button>
        </form>
      </Card>
    </DashboardShell>
  );
}
