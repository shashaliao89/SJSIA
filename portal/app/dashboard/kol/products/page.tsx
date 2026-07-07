"use client";

import { useEffect, useState } from "react";
import { ApiError, api, STATUS_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Product } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { KOL_NAV, formatDate } from "@/lib/nav";

export default function KolProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<{ products: Product[] }>("/api/products", { token })
      .then((d) => setProducts(d.products))
      .catch(() => setProducts([]));
  }, [token]);

  async function apply(id: string) {
    setMessage("");
    try {
      await api(`/api/products/${id}/apply`, {
        method: "POST",
        token,
        body: JSON.stringify({ message: "希望申請體驗" }),
      });
      setMessage("公關品申請已送出");
      const data = await api<{ products: Product[] }>("/api/products", { token });
      setProducts(data.products);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "申請失敗");
    }
  }

  return (
    <DashboardShell role="kol" title="KOL Dashboard" nav={KOL_NAV}>
      <PageHeader title="公關品申請" description="瀏覽品牌提供的體驗資源並提交申請。" />
      {message ? <p className="mb-4 text-sm font-semibold text-[#CFFF1A]">{message}</p> : null}
      {products.length === 0 ? (
        <EmptyState message="目前尚無可申請的公關品" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id}>
              <p className="text-sm text-[#CFFF1A]">{p.brand_name ?? "品牌"}</p>
              <h3 className="mt-1 text-lg font-black">{p.name}</h3>
              <p className="mt-3 text-sm text-gray-300">{p.experience_content}</p>
              {p.required_deliverables ? (
                <p className="mt-2 text-sm text-gray-400">需產出：{p.required_deliverables}</p>
              ) : null}
              {p.application_status ? (
                <Badge tone="warning" className="mt-4">
                  申請狀態：{STATUS_LABELS[p.application_status] ?? p.application_status}
                </Badge>
              ) : (
                <Button className="mt-4" onClick={() => apply(p.id)}>
                  申請體驗
                </Button>
              )}
              <p className="mt-2 text-xs text-gray-500">截止：{formatDate(p.application_deadline)}</p>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
