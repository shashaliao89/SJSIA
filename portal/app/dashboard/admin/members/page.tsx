"use client";

import { useEffect, useState } from "react";
import { ApiError, api, STATUS_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Member } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { ADMIN_NAV, formatDate } from "@/lib/nav";

export default function AdminMembersPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<"all" | "brand" | "kol">("all");

  async function load() {
    const data = await api<{ members: Member[] }>("/api/members", { token });
    setMembers(data.members);
  }

  useEffect(() => {
    load().catch(() => setMembers([]));
  }, [token]);

  async function updateStatus(id: string, status: string) {
    try {
      await api(`/api/members/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "更新失敗");
    }
  }

  const filtered = members.filter((m) => filter === "all" || m.role === filter);

  return (
    <DashboardShell role="admin" title="Admin Dashboard" nav={ADMIN_NAV}>
      <PageHeader title="會員管理" description="審核品牌與 KOL 會員、管理狀態與期限。" />
      <div className="mb-6 flex gap-2">
        {(["all", "brand", "kol"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
              filter === f ? "bg-[#CFFF1A] text-black" : "border border-white/15 text-gray-300"
            }`}
          >
            {f === "all" ? "全部" : f === "brand" ? "品牌" : "KOL"}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="尚無會員" />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black">{m.brand_name ?? m.kol_name ?? m.email}</p>
                <p className="text-sm text-gray-400">
                  {m.email} · {m.role === "brand" ? "品牌方" : "KOL"}
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge tone={m.status === "approved" ? "success" : m.status === "pending" ? "warning" : "danger"}>
                    {STATUS_LABELS[m.status] ?? m.status}
                  </Badge>
                  {m.membership_expires_at ? (
                    <Badge>到期 {formatDate(m.membership_expires_at)}</Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {m.status !== "approved" ? (
                  <Button onClick={() => updateStatus(m.id, "approved")}>通過</Button>
                ) : null}
                {m.status !== "suspended" ? (
                  <Button variant="danger" onClick={() => updateStatus(m.id, "suspended")}>
                    停用
                  </Button>
                ) : null}
                {m.status === "suspended" ? (
                  <Button variant="secondary" onClick={() => updateStatus(m.id, "pending")}>
                    恢復待審
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
