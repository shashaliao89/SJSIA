"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FOLLOWER_TIERS, followerTier, formatFollowers } from "@/lib/kolTiers";
import type { FollowerTier, KolProfile } from "@/lib/types";
import {
  DashboardShell,
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
} from "@/components/DashboardShell";
import { ADMIN_NAV } from "@/lib/nav";

function boardingTone(status?: string | null) {
  if (status?.includes("方案")) return "success";
  if (status === "資格不合") return "danger";
  if (status === "無法") return "warning";
  return "default";
}
export default function AdminKolsPage() {
  const { token } = useAuth();
  const [kols, setKols] = useState<KolProfile[]>([]);
  const [editing, setEditing] = useState<KolProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<FollowerTier | "all">("all");
  const [selectedBoardingStatus, setSelectedBoardingStatus] = useState("all");
  const boardingStatuses = useMemo(
    () =>
      Array.from(new Set(kols.map((kol) => kol.boarding_status?.trim()).filter((status): status is string => Boolean(status))))
        .sort((a, b) => a.localeCompare(b, "zh-Hant")),
    [kols]
  );
  const filteredKols = useMemo(
    () =>
      kols
        .filter((kol) => {
          const matchesTier =
            selectedTier === "all" ||
            (kol.follower_tier ?? followerTier(kol.follower_count ?? 0)) === selectedTier;
          const matchesBoardingStatus =
            selectedBoardingStatus === "all" ||
            (selectedBoardingStatus === "unlabeled"
              ? !kol.boarding_status?.trim()
              : kol.boarding_status?.trim() === selectedBoardingStatus);
          return matchesTier && matchesBoardingStatus;
        })
        .sort(
          (a, b) =>
            (b.follower_count ?? 0) - (a.follower_count ?? 0) ||
            a.name.localeCompare(b.name, "zh-Hant")
        ),
    [kols, selectedTier, selectedBoardingStatus]
  );

  async function load() {
    const data = await api<{ kols: KolProfile[] }>("/api/kols", { token });
    setKols(data.kols);
  }

  useEffect(() => {
    load()
      .catch(() => setKols([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name"),
      ig_url: fd.get("ig_url") || null,
      youtube_url: editing?.youtube_url ?? null,
      tiktok_url: editing?.tiktok_url ?? null,
      follower_count: Number(fd.get("follower_count") || 0),
      follower_count_raw: editing?.follower_count_raw ?? null,
      audience_profile: editing?.audience_profile ?? null,
      content_types: editing?.content_types ?? [],
      collaboration_types: editing?.collaboration_types ?? [],
      collaboration_price: fd.get("collaboration_price") || null,
      boarding_status: fd.get("boarding_status") || null,
      membership_tag: fd.get("membership_tag") || null,
      data_check: editing?.data_check ?? null,
      past_cases: editing?.past_cases ?? null,
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

  function openEditor(kol?: KolProfile) {
    setEditing(kol ?? null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <DashboardShell role="admin" title="Admin Dashboard" nav={ADMIN_NAV}>
      <PageHeader
        title="KOL 會員管理"
        description="查看協會 KOL 的粉絲級距、完整合作報價與登船狀態／方案；這些內部欄位不會顯示給品牌端。"
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button onClick={() => openEditor()}>+ 新增 KOL</Button>
        <Badge>{kols.length} 位 KOL</Badge>
      </div>

      {showForm ? (
        <Card className="mb-8 border-[#CFFF1A]/20">
          <h3 className="mb-5 text-lg font-black">{editing ? `編輯：${editing.name}` : "新增 KOL"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4" key={editing?.id ?? "new"}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name">IG 顯示名稱</label>
                <input id="name" name="name" required defaultValue={editing?.name ?? ""} />
              </div>
              <div>
                <label htmlFor="ig_url">Instagram 連結</label>
                <input id="ig_url" name="ig_url" defaultValue={editing?.ig_url ?? ""} />
              </div>
              <div>
                <label htmlFor="follower_count">粉絲數</label>
                <input
                  id="follower_count"
                  name="follower_count"
                  type="number"
                  min="0"
                  defaultValue={editing?.follower_count ?? 0}
                />
              </div>
              <div>
                <label htmlFor="boarding_status">登船狀態／方案</label>
                <input
                  id="boarding_status"
                  name="boarding_status"
                  placeholder="例如：方案一、方案二、無法、資格不合"
                  defaultValue={editing?.boarding_status ?? ""}
                />
              </div>
              <div>
                <label htmlFor="membership_tag">會員標籤</label>
                <input
                  id="membership_tag"
                  name="membership_tag"
                  placeholder="例如：Tier 1"
                  defaultValue={editing?.membership_tag ?? ""}
                />
              </div>
            </div>
            <div>
              <label htmlFor="collaboration_price">完整合作報價</label>
              <textarea
                id="collaboration_price"
                name="collaboration_price"
                rows={5}
                defaultValue={editing?.collaboration_price ?? ""}
              />
            </div>
            <div className="flex flex-wrap gap-5">
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
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                取消
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <EmptyState message="載入中…" />
      ) : kols.length === 0 ? (
        <EmptyState message="尚無 KOL 資料" />
      ) : (
        <div>
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-3 px-1 text-xs font-black tracking-wide text-gray-500">粉絲數篩選</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="依粉絲數篩選 KOL">
              <button
                type="button"
                onClick={() => setSelectedTier("all")}
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
                  selectedTier === "all" ? "bg-[#CFFF1A] text-black" : "border border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                全部 <span className="ml-1 opacity-60">{kols.length}</span>
              </button>
              {FOLLOWER_TIERS.map((tier) => {
                const count = kols.filter(
                  (kol) => (kol.follower_tier ?? followerTier(kol.follower_count ?? 0)) === tier.key
                ).length;
                return (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() => setSelectedTier(tier.key)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
                      selectedTier === tier.key
                        ? "bg-[#CFFF1A] text-black"
                        : "border border-white/10 text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {tier.label} <span className="ml-1 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="my-4 border-t border-white/10" />
            <p className="mb-3 px-1 text-xs font-black tracking-wide text-gray-500">合作狀態</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="依合作狀態篩選 KOL">
              <button
                type="button"
                onClick={() => setSelectedBoardingStatus("all")}
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
                  selectedBoardingStatus === "all"
                    ? "bg-[#CFFF1A] text-black"
                    : "border border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                全部 <span className="ml-1 opacity-60">{kols.length}</span>
              </button>
              {boardingStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedBoardingStatus(status)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
                    selectedBoardingStatus === status
                      ? "bg-[#CFFF1A] text-black"
                      : "border border-white/10 text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {status} <span className="ml-1 opacity-60">{kols.filter((kol) => kol.boarding_status?.trim() === status).length}</span>
                </button>
              ))}
              {kols.some((kol) => !kol.boarding_status?.trim()) ? (
                <button
                  type="button"
                  onClick={() => setSelectedBoardingStatus("unlabeled")}
                  className={`rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
                    selectedBoardingStatus === "unlabeled"
                      ? "bg-[#CFFF1A] text-black"
                      : "border border-white/10 text-gray-300 hover:bg-white/5"
                  }`}
                >
                  未標註 <span className="ml-1 opacity-60">{kols.filter((kol) => !kol.boarding_status?.trim()).length}</span>
                </button>
              ) : null}
            </div>
          </div>

          {filteredKols.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-gray-500">
              此篩選條件目前沒有 KOL
            </p>
          ) : (
            <div className="space-y-4">
              {filteredKols.map((kol) => (
                  <Card key={kol.id}>
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-black">{kol.name}</h4>
                          <Badge tone={boardingTone(kol.boarding_status)}>
                            {kol.boarding_status || "未標註方案"}
                          </Badge>
                          {kol.membership_tag ? <Badge>{kol.membership_tag}</Badge> : null}
                          {kol.is_public ? <Badge tone="success">品牌端公開</Badge> : <Badge>不公開</Badge>}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400">
                          <span>
                            IG 粉絲：<strong className="text-white">{formatFollowers(kol.follower_count)}</strong>
                          </span>
                          {kol.ig_url ? (
                            <a href={kol.ig_url} target="_blank" rel="noreferrer" className="font-bold text-[#CFFF1A] hover:underline">
                              Instagram ↗
                            </a>
                          ) : (
                            <span className="text-yellow-300">IG 連結待確認</span>
                          )}
                        </div>
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                          <p className="mb-2 text-xs font-black tracking-wide text-gray-500">合作報價（僅管理員）</p>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                            {kol.collaboration_price || "尚未提供報價"}
                          </p>
                        </div>
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-black tracking-wide text-gray-500">KOL 定位標籤</p>
                          {kol.content_types?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {kol.content_types.slice(0, 5).map((tag) => (
                                <Badge key={tag}>{tag}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">尚未建立定位標籤</p>
                          )}
                        </div>
                      </div>
                      <Button variant="secondary" onClick={() => openEditor(kol)}>
                        編輯
                      </Button>
                    </div>
                  </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
