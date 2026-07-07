"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Product } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { BRAND_NAV, formatDate } from "@/lib/nav";

export default function BrandProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const data = await api<{ products: Product[] }>("/api/products", { token });
    setProducts(data.products);
  }

  useEffect(() => {
    load().catch(() => setProducts([]));
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await api("/api/products", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: fd.get("name"),
          quantity: Number(fd.get("quantity")),
          experience_content: fd.get("experience_content"),
          collaboration_terms: fd.get("collaboration_terms"),
          required_deliverables: fd.get("required_deliverables"),
          application_deadline: fd.get("application_deadline") || null,
        }),
      });
      form.reset();
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "新增失敗");
    }
  }

  return (
    <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}>
      <PageHeader title="公關品 / 體驗資源管理" description="新增產品或服務體驗資源，供 KOL 申請。" />
      <div className="mb-6">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "取消" : "+ 新增公關品"}
        </Button>
      </div>
      {showForm ? (
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name">產品 / 服務名稱</label>
              <input id="name" name="name" required />
            </div>
            <div>
              <label htmlFor="quantity">數量</label>
              <input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
            </div>
            <div>
              <label htmlFor="experience_content">體驗內容</label>
              <textarea id="experience_content" name="experience_content" rows={3} required />
            </div>
            <div>
              <label htmlFor="collaboration_terms">合作條件</label>
              <textarea id="collaboration_terms" name="collaboration_terms" rows={2} />
            </div>
            <div>
              <label htmlFor="required_deliverables">需要產出的內容</label>
              <textarea id="required_deliverables" name="required_deliverables" rows={2} />
            </div>
            <div>
              <label htmlFor="application_deadline">申請截止日期</label>
              <input id="application_deadline" name="application_deadline" type="date" />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button type="submit">儲存</Button>
          </form>
        </Card>
      ) : null}
      {products.length === 0 ? (
        <EmptyState message="尚未新增公關品" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <h3 className="font-black">{p.name}</h3>
                <Badge>{p.status === "active" ? "進行中" : "已結束"}</Badge>
              </div>
              <p className="mt-2 text-sm text-gray-400">數量：{p.quantity}</p>
              <p className="mt-3 text-sm text-gray-300">{p.experience_content}</p>
              <p className="mt-2 text-xs text-gray-500">截止：{formatDate(p.application_deadline)}</p>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
