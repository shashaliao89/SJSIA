"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BrandProfile } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { KOL_NAV } from "@/lib/nav";

export default function KolBrandsPage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<{ brands: BrandProfile[] }>("/api/brands", { token })
      .then((d) => setBrands(d.brands))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function contactBrand(id: string) {
    setMessage("");
    try {
      const res = await api<{ message: string }>(`/api/brands/${id}/contact`, {
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
    <DashboardShell role="kol" title="KOL Dashboard" nav={KOL_NAV}>
      <PageHeader title="品牌資料庫" description="瀏覽協會公開的品牌名單，發起洽談申請。" />
      {message ? <p className="mb-4 text-sm font-semibold text-[#CFFF1A]">{message}</p> : null}
      {loading ? (
        <EmptyState message="載入中…" />
      ) : brands.length === 0 ? (
        <EmptyState message="目前尚無公開品牌資料" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black">{brand.brand_name}</h3>
                {brand.open_to_contact ? (
                  <Badge tone="success">開放聯繫</Badge>
                ) : (
                  <Badge>暫不開放</Badge>
                )}
              </div>
              {brand.company_intro ? (
                <p className="mt-3 text-sm leading-relaxed text-gray-300">{brand.company_intro}</p>
              ) : null}
              {brand.contact_name ? (
                <p className="mt-2 text-sm text-gray-400">聯絡人：{brand.contact_name}</p>
              ) : null}
              <Button
                className="mt-5 w-full"
                disabled={!brand.open_to_contact}
                onClick={() => contactBrand(brand.id)}
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
