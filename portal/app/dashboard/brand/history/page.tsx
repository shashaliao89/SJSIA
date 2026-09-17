"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation } from "@/lib/types";
import { ConversationList } from "@/components/ConversationList";
import { ConversationModal } from "@/components/ConversationModal";
import { Button, DashboardShell, PageHeader } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";

export default function BrandCaseHistoryPage() {
  const { token } = useAuth();
  const [support, setSupport] = useState<Conversation | null>(null);
  const [openingSupport, setOpeningSupport] = useState(false);
  const [supportError, setSupportError] = useState("");

  async function openSupport() {
    setOpeningSupport(true);
    setSupportError("");
    try {
      const data = await api<{ conversation: Conversation }>("/api/conversations/support", { method: "POST", token });
      setSupport(data.conversation);
    } catch {
      setSupportError("聊天室暫時無法開啟，請稍後再試。");
    } finally {
      setOpeningSupport(false);
    }
  }

  return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
    <PageHeader title="歷史紀錄" description="集中查看案件進度、對話與過往合作紀錄。" />
    <section className="mb-10 flex flex-col gap-5 rounded-2xl border border-[#CFFF1A]/25 bg-[#CFFF1A]/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="max-w-xl"><h2 className="text-lg font-black">需要協會協助嗎？</h2><p className="mt-1.5 text-sm leading-6 text-gray-400">有案件問題或不確定合作方向，可直接與管理員對話。</p>{supportError ? <p className="mt-2 text-sm font-bold text-red-400">{supportError}</p> : null}</div>
      <Button className="w-full shrink-0 sm:w-auto" disabled={openingSupport} onClick={openSupport}>{openingSupport ? "開啟中…" : "聯繫管理員"}</Button>
    </section>
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-lg font-black">進行中的案件</h2>
          <p className="mt-1 text-sm text-gray-500">點擊案件查看進度或回覆訊息</p>
        </div>
      </div>
      <ConversationList mode="active" emptyMessage="目前沒有進行中的案件；可前往「我的案件」發起需求或聯繫管理員。" />
    </section>
    <section>
      <div className="mb-4 border-b border-white/10 pb-3">
        <h2 className="text-lg font-black">過往案件</h2>
        <p className="mt-1 text-sm text-gray-500">已結案或撤回的案件與完整對話</p>
      </div>
      <ConversationList mode="history" compact emptyMessage="目前尚無歷史紀錄" />
    </section>
    {support ? <ConversationModal conversation={support} onClose={() => setSupport(null)} /> : null}
  </DashboardShell>;
}
