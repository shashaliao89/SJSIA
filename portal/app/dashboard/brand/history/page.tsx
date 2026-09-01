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
    <PageHeader title="案件聊天室與歷史紀錄" description="查看進行中的案件、回覆協會管理員，並保留所有已結案或已撤回的過往對話。" />
    <section className="mb-8 flex flex-col gap-5 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl"><p className="text-xs font-black tracking-[0.18em] text-[#CFFF1A]">SJSIA MEMBER SUPPORT</p><h2 className="mt-2 text-xl font-black">需要協會協助嗎？</h2><p className="mt-2 text-sm leading-relaxed text-gray-400">不確定該選哪種合作、需要補充案件資訊，或有其他會員問題，都可以直接開啟客服聊天室。</p>{supportError ? <p className="mt-2 text-sm font-bold text-red-400">{supportError}</p> : null}</div>
      <Button className="shrink-0" disabled={openingSupport} onClick={openSupport}>{openingSupport ? "開啟中…" : "直接聯繫管理員"}</Button>
    </section>
    <section className="mb-8">
      <div className="mb-4">
        <p className="text-xs font-black tracking-[0.18em] text-[#CFFF1A]">ACTIVE CHATS</p>
        <h2 className="mt-1 text-xl font-black">進行中的案件聊天室</h2>
        <p className="mt-1 text-sm text-gray-500">點擊案件即可查看進度並回覆協會管理員。</p>
      </div>
      <ConversationList mode="active" emptyMessage="目前沒有進行中的案件；可前往「我的案件」發起需求或聯繫管理員。" />
    </section>
    <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
      <div className="mb-5 border-b border-white/10 pb-5">
        <p className="text-xs font-black tracking-[0.18em] text-[#CFFF1A]">CASE ARCHIVE</p>
        <h2 className="mt-2 text-xl font-black">過往案件與完整對話</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">歷史資料會持續保留，點擊任一案件即可重新查看處理過程與訊息紀錄。</p>
      </div>
      <ConversationList mode="history" compact emptyMessage="目前尚無歷史紀錄" />
    </section>
    {support ? <ConversationModal conversation={support} onClose={() => setSupport(null)} /> : null}
  </DashboardShell>;
}
