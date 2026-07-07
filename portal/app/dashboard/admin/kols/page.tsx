"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, COLLAB_TYPES, CONTENT_TYPES } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { KolProfile } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { ADMIN_NAV } from "@/lib/nav";

export default function AdminKolsPage() {
  const { token } = useAuth();
  const [kols, setKols] = useState<KolProfile[]>([]);
  const [editing, setEditing] = useState<KolProfile | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await api<{ kols: KolProfile[] }>("/api/kols", { token });
    setKols(data.kols);
  }

  useEffect(() => {
    load().catch(() => setKols([]));
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const contentTypes = CONTENT_TYPES.filter((t) => fd.get(`ct_${t}`) === "on");
    const collabTypes = COLLAB_TYPES.filter((t) => fd.get(`cl_${t}`) === "on");
    const payload = {
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
    };

    try {
      if (editing) {
        await api(`/api/kols/${editing.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/kols", { method: "POST", token, body: JSON.stringify(payload) });
      }
      setShowForm(false);
      setEditing(null);
      form.reset();
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "儲存失敗");
    }
  }

  return (
    <DashboardShell role="admin" title="Admin Dashboard" nav={ADMIN_NAV}>
      <PageHeader title="KOL 管理" description="新增、編輯 KOL 資料，設定是否公開給品牌方。" />
      <div className="mb-6">
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + 新增 KOL
        </Button>
      </div>

      {showForm ? (
        <Card className="mb-8">
          <h3 className="mb-4 font-black">{editing ? "編輯 KOL" : "新增 KOL"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4" key={editing?.id ?? "new"}>
            <div>
              <label htmlFor="name">KOL 名稱</label>
              <input id="name" name="name" required defaultValue={editing?.name ?? ""} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="ig_url">Instagram</label>
                <input id="ig_url" name="ig_url" defaultValue={editing?.ig_url ?? ""} />
              </div>
              <div>
                <label htmlFor="youtube_url">YouTube</label>
                <input id="youtube_url" name="youtube_url" defaultValue={editing?.youtube_url ?? ""} />
              </div>
              <div>
                <label htmlFor="tiktok_url">TikTok</label>
                <input id="tiktok_url" name="tiktok_url" defaultValue={editing?.tiktok_url ?? ""} />
              </div>
            </div>
            <div>
              <label htmlFor="follower_count">粉絲數</label>
              <input
                id="follower_count"
                name="follower_count"
                type="number"
                defaultValue={editing?.follower_count ?? 0}
              />
            </div>
            <div>
              <label htmlFor="collaboration_price">合作報價</label>
              <input
                id="collaboration_price"
                name="collaboration_price"
                defaultValue={editing?.collaboration_price ?? ""}
              />
            </div>
            <div>
              <label htmlFor="past_cases">過往案例</label>
              <textarea id="past_cases" name="past_cases" rows={2} defaultValue={editing?.past_cases ?? ""} />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" name="is_public" className="w-auto" defaultChecked={editing?.is_public ?? true} />
                公開給品牌方
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  name="open_to_contact"
                  className="w-auto"
                  defaultChecked={editing?.open_to_contact ?? true}
                />
                開放聯繫
              </label>
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

      {kols.length === 0 ? (
        <EmptyState message="尚無 KOL 資料" />
      ) : (
        <div className="space-y-3">
          {kols.map((kol) => (
            <Card key={kol.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black">{kol.name}</p>
                <p className="text-sm text-gray-400">粉絲 {kol.follower_count?.toLocaleString() ?? 0}</p>
                <div className="mt-2 flex gap-2">
                  {kol.is_public ? <Badge tone="success">公開</Badge> : <Badge>不公開</Badge>}
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(kol);
                  setShowForm(true);
                }}
              >
                編輯
              </Button>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
