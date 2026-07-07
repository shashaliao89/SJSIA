"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { KolProfile } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";

export default function BrandKolsPage() {
  const { token } = useAuth();
  const [kols, setKols] = useState<KolProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<{ kols: KolProfile[] }>("/api/kols", { token })
      .then((d) => setKols(d.kols))
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
      <PageHeader title="KOL 資料庫" description="瀏覽協會公開的 KOL 名單，發起洽談申請。" />
      {message ? <p className="mb-4 text-sm font-semibold text-[#CFFF1A]">{message}</p> : null}
      {loading ? (
        <EmptyState message="載入中…" />
      ) : kols.length === 0 ? (
        <EmptyState message="目前尚無公開 KOL 資料" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kols.map((kol) => (
            <Card key={kol.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black">{kol.name}</h3>
                {kol.open_to_contact ? (
                  <Badge tone="success">開放聯繫</Badge>
                ) : (
                  <Badge>暫不開放</Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-400">粉絲數：{kol.follower_count?.toLocaleString() ?? "—"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(kol.content_types ?? []).map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(kol.collaboration_types ?? []).map((t) => (
                  <Badge key={t} tone="warning">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-sm">
                {kol.ig_url ? (
                  <a href={kol.ig_url} target="_blank" rel="noreferrer" className="block text-[#CFFF1A] hover:underline">
                    Instagram
                  </a>
                ) : null}
                {kol.youtube_url ? (
                  <a href={kol.youtube_url} target="_blank" rel="noreferrer" className="block text-[#CFFF1A] hover:underline">
                    YouTube
                  </a>
                ) : null}
                {kol.tiktok_url ? (
                  <a href={kol.tiktok_url} target="_blank" rel="noreferrer" className="block text-[#CFFF1A] hover:underline">
                    TikTok
                  </a>
                ) : null}
              </div>
              {kol.past_cases ? (
                <p className="mt-4 text-sm leading-relaxed text-gray-300">{kol.past_cases}</p>
              ) : null}
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
    </DashboardShell>
  );
}
