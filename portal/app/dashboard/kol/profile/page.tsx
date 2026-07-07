"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, COLLAB_TYPES, CONTENT_TYPES } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { KolProfile } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button } from "@/components/DashboardShell";
import { KOL_NAV } from "@/lib/nav";

export default function KolProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<KolProfile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ profile: KolProfile | null }>("/api/kols/profile", { token })
      .then((d) => setProfile(d.profile))
      .catch(() => setProfile(null));
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const contentTypes = CONTENT_TYPES.filter((t) => fd.get(`ct_${t}`) === "on");
    const collabTypes = COLLAB_TYPES.filter((t) => fd.get(`cl_${t}`) === "on");

    try {
      const data = await api<{ profile: KolProfile }>("/api/kols/profile", {
        method: "PUT",
        token,
        body: JSON.stringify({
          name: fd.get("name"),
          ig_url: fd.get("ig_url") || null,
          youtube_url: fd.get("youtube_url") || null,
          tiktok_url: fd.get("tiktok_url") || null,
          follower_count: Number(fd.get("follower_count") || 0),
          audience_profile: fd.get("audience_profile") || null,
          content_types: contentTypes,
          collaboration_types: collabTypes,
          collaboration_price: fd.get("collaboration_price") || null,
          past_cases: fd.get("past_cases") || null,
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
      <DashboardShell role="kol" title="KOL Dashboard" nav={KOL_NAV}>
        <PageHeader title="基本資料" />
        <Card><p className="text-gray-400">載入中…</p></Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="kol" title="KOL Dashboard" nav={KOL_NAV}>
      <PageHeader title="基本資料" description="維護您的公開媒體資訊，供品牌方在 KOL 資料庫瀏覽。" />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name">顯示名稱</label>
            <input id="name" name="name" defaultValue={profile.name} required />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="ig_url">Instagram</label>
              <input id="ig_url" name="ig_url" defaultValue={profile.ig_url ?? ""} />
            </div>
            <div>
              <label htmlFor="youtube_url">YouTube</label>
              <input id="youtube_url" name="youtube_url" defaultValue={profile.youtube_url ?? ""} />
            </div>
            <div>
              <label htmlFor="tiktok_url">TikTok</label>
              <input id="tiktok_url" name="tiktok_url" defaultValue={profile.tiktok_url ?? ""} />
            </div>
          </div>
          <div>
            <label htmlFor="follower_count">粉絲數</label>
            <input
              id="follower_count"
              name="follower_count"
              type="number"
              defaultValue={profile.follower_count ?? 0}
            />
          </div>
          <div>
            <label htmlFor="audience_profile">受眾輪廓</label>
            <textarea
              id="audience_profile"
              name="audience_profile"
              rows={2}
              defaultValue={profile.audience_profile ?? ""}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-300">內容類型</p>
            <div className="flex flex-wrap gap-3">
              {CONTENT_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm font-normal text-gray-300">
                  <input
                    type="checkbox"
                    name={`ct_${t}`}
                    className="w-auto"
                    defaultChecked={profile.content_types?.includes(t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-300">合作形式</p>
            <div className="flex flex-wrap gap-3">
              {COLLAB_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm font-normal text-gray-300">
                  <input
                    type="checkbox"
                    name={`cl_${t}`}
                    className="w-auto"
                    defaultChecked={profile.collaboration_types?.includes(t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="collaboration_price">合作報價</label>
            <input
              id="collaboration_price"
              name="collaboration_price"
              defaultValue={profile.collaboration_price ?? ""}
            />
          </div>
          <div>
            <label htmlFor="past_cases">過往案例</label>
            <textarea id="past_cases" name="past_cases" rows={3} defaultValue={profile.past_cases ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm font-normal text-gray-300">
            <input
              type="checkbox"
              name="open_to_contact"
              className="w-auto"
              defaultChecked={profile.open_to_contact}
            />
            開放品牌聯繫
          </label>
          <label className="flex items-center gap-2 text-sm font-normal text-gray-300">
            <input
              type="checkbox"
              name="is_public"
              className="w-auto"
              defaultChecked={profile.is_public}
            />
            公開顯示於 KOL 資料庫
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {message ? <p className="text-sm text-[#CFFF1A]">{message}</p> : null}
          <Button type="submit">儲存資料</Button>
        </form>
      </Card>
    </DashboardShell>
  );
}
