"use client";

import { useEffect, useMemo, useState } from "react";
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
import { BRAND_NAV } from "@/lib/nav";

export default function BrandKolsPage() {
  const { token } = useAuth();
  const [kols, setKols] = useState<KolProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedTier, setSelectedTier] = useState<FollowerTier | "all">("all");
  const filteredKols = useMemo(
    () =>
      selectedTier === "all"
        ? kols
        : kols.filter((kol) => (kol.follower_tier ?? followerTier(kol.follower_count ?? 0)) === selectedTier),
    [kols, selectedTier]
  );

  useEffect(() => {
    api<{ kols: KolProfile[] }>("/api/kols", { token })
      .then((data) => setKols(data.kols))
      .catch(() => setKols([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function contactKol(id: string) {
    setMessage("");
    try {
      const res = await api<{ message: string }>(`/api/kols/${id}/contact`, {
        method: "POST",
        token,
        body: JSON.stringify({ message: "希望進一步洽談合作" }),
      });
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "申請失敗");
    }
  }

  return (
    <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}>
      <PageHeader
        title="KOL 資料庫"
        description="依 Instagram 粉絲數瀏覽協會 KOL；品牌端僅顯示公開資料，不顯示合作報價與會員方案。"
      />
      {message ? (
        <p className="mb-5 rounded-xl bg-[#CFFF1A]/10 px-4 py-3 text-sm font-semibold text-[#CFFF1A]">
          {message}
        </p>
      ) : null}
      {loading ? (
        <EmptyState message="載入中…" />
      ) : kols.length === 0 ? (
        <EmptyState message="目前尚無公開 KOL 資料" />
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
          </div>

          {filteredKols.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-gray-500">
              此篩選條件目前沒有 KOL
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredKols.map((kol) => (
                    <Card key={kol.id} className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-lg font-black">{kol.name}</h4>
                        <Badge tone={kol.open_to_contact ? "success" : "default"}>
                          {kol.open_to_contact ? "開放聯繫" : "暫不開放"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-gray-400">
                        IG 粉絲數：
                        <span className="font-bold text-white">{formatFollowers(kol.follower_count)}</span>
                      </p>
                      <div className="mt-4 flex-1">
                        {kol.ig_url ? (
                          <a
                            href={kol.ig_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-[#CFFF1A] hover:border-[#CFFF1A]/40"
                          >
                            查看 Instagram ↗
                          </a>
                        ) : (
                          <span className="text-sm text-gray-600">Instagram 待補</span>
                        )}
                      </div>
                      <Button
                        className="mt-5 w-full"
                        disabled={!kol.open_to_contact}
                        onClick={() => contactKol(kol.id)}
                      >
                        聯繫 / 洽談申請
                      </Button>
                    </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
