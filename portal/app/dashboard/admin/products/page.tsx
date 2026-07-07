"use client";

import { useEffect, useState } from "react";
import { ApiError, api, STATUS_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Product } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { ADMIN_NAV, formatDate } from "@/lib/nav";

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api<{ products: Product[] }>("/api/products", { token })
      .then((d) => setProducts(d.products))
      .catch(() => setProducts([]));
  }, [token]);

  return (
    <DashboardShell role="admin" title="Admin Dashboard" nav={ADMIN_NAV}>
      <PageHeader title="公關品管理" description="查看品牌提交的公關品與 KOL 申請（MVP：列表檢視）。" />
      {products.length === 0 ? (
        <EmptyState message="尚無公關品" />
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <Card key={p.id}>
              <p className="text-sm text-[#CFFF1A]">{p.brand_name ?? "品牌"}</p>
              <h3 className="font-black">{p.name}</h3>
              <p className="mt-2 text-sm text-gray-300">{p.experience_content}</p>
              <p className="mt-2 text-xs text-gray-500">
                數量 {p.quantity} · 截止 {formatDate(p.application_deadline)}
              </p>
              <Badge className="mt-3">{p.status === "active" ? "進行中" : "已結束"}</Badge>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
