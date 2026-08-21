"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, api, STATUS_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Member } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { ADMIN_NAV, formatDate } from "@/lib/nav";

export default function AdminBrandsPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "suspended">("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api<{ members: Member[] }>("/api/members", { token });
    setMembers(data.members.filter((member) => member.role === "brand"));
  }

  useEffect(() => {
    load()
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function updateStatus(id: string, status: "pending" | "approved" | "suspended") {
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

  const filtered = useMemo(
    () => members.filter((member) => statusFilter === "all" || member.status === statusFilter),
    [members, statusFilter]
  );

  return (
    <DashboardShell role="admin" title="協會管理後台" nav={ADMIN_NAV}>
      <PageHeader title="品牌管理" description="查看協會團體會員資料，管理品牌審核與會員狀態。" />

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-3 px-1 text-xs font-black tracking-wide text-gray-500">會員狀態</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="依會員狀態篩選品牌">
          {(["all", "pending", "approved", "suspended"] as const).map((status) => {
            const count = status === "all" ? members.length : members.filter((member) => member.status === status).length;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
                  statusFilter === status
                    ? "bg-[#CFFF1A] text-black"
                    : "border border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                {status === "all" ? "全部" : STATUS_LABELS[status] ?? status}
                <span className="ml-1 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <EmptyState message="載入中…" />
      ) : filtered.length === 0 ? (
        <EmptyState message="目前沒有符合條件的品牌會員" />
      ) : (
        <div className="space-y-4">
          {filtered.map((member) => (
            <Card key={member.id}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{member.brand_name ?? member.email ?? "未命名品牌"}</h3>
                    <Badge tone={member.status === "approved" ? "success" : member.status === "pending" ? "warning" : "danger"}>
                      {STATUS_LABELS[member.status] ?? member.status}
                    </Badge>
                    {member.imported ? <Badge>Google Form 第 {member.source_row} 列</Badge> : <Badge>後台註冊</Badge>}
                    {member.boarding_status ? <Badge>{member.boarding_status}</Badge> : null}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-gray-400 sm:grid-cols-2">
                    <p>代表人：<span className="text-gray-200">{member.representative_name || "未提供"}</span></p>
                    <p>Email：<span className="text-gray-200">{member.email || "未提供"}</span></p>
                    <p>Line ID：<span className="text-gray-200">{member.line_id || "未提供"}</span></p>
                    <p>會員期限：<span className="text-gray-200">{member.membership_expires_at ? formatDate(member.membership_expires_at) : "未設定"}</span></p>
                  </div>
                  {member.website_url ? (
                    <a href={member.website_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-[#CFFF1A] hover:underline">
                      查看品牌連結 ↗
                    </a>
                  ) : null}
                  {member.application_note ? (
                    <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-gray-300">
                      {member.application_note}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {member.status !== "approved" ? (
                    <Button onClick={() => updateStatus(member.id, "approved")}>通過</Button>
                  ) : null}
                  {member.status !== "suspended" ? (
                    <Button variant="danger" onClick={() => updateStatus(member.id, "suspended")}>停用</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => updateStatus(member.id, "pending")}>恢復待審</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
