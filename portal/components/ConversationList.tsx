"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation } from "@/lib/types";
import { Badge, Card, EmptyState } from "./DashboardShell";
import { ConversationModal } from "./ConversationModal";

const TYPE_LABELS: Record<string,string> = { kol_contact:"創作者洽談", marketing_request:"行銷需求", commercial_opportunity:"商業提案", sponsorship_seek:"尋求贊助品", sponsorship_offer:"提供贊助品", general_support:"協會客服" };
const STATUS_LABELS: Record<string,string> = { pending:"待處理", in_progress:"進行中", closed:"已結案" };

export function ConversationList({ types, statuses, mode = "all", emptyMessage = "目前尚無案件", compact = false }: { types?: string[]; statuses?: string[]; mode?: "all" | "active" | "history"; emptyMessage?: string; compact?: boolean }) {
  const { token } = useAuth();
  const [items, setItems] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const data = await api<{ conversations: Conversation[] }>("/api/conversations?limit=50", { token });
    setItems(data.conversations.filter(item => {
      const typeMatch = !types?.length || types.includes(item.conversation_type);
      const statusMatch = !statuses?.length || statuses.includes(item.status);
      const modeMatch = mode === "all" || (mode === "active" ? item.status !== "closed" && !item.withdrawn : item.status === "closed" || item.withdrawn);
      return typeMatch && statusMatch && modeMatch;
    }));
  }, [token, types?.join(","), statuses?.join(","), mode]);
  useEffect(() => { load().catch(() => setItems([])).finally(() => setLoading(false)); const timer=window.setInterval(() => load().catch(()=>undefined),5000); return () => clearInterval(timer); }, [load]);
  if (loading) return <EmptyState message="載入案件中…" />;
  if (!items.length) return <EmptyState message={emptyMessage} />;
  return <><div className="space-y-3">{items.map(item => <button key={item.id} type="button" onClick={() => setSelected(item)} className="block w-full text-left"><Card className={`transition hover:border-[#CFFF1A]/40 ${item.unread_count ? "border-[#CFFF1A]/30 bg-[#CFFF1A]/[0.04]" : ""} ${compact ? "p-4" : ""}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge>{TYPE_LABELS[item.conversation_type]}</Badge><Badge tone={item.status === "closed" ? "default" : item.status === "pending" ? "warning" : "success"}>{STATUS_LABELS[item.status]}</Badge>{item.withdrawn ? <Badge tone="warning">已撤回</Badge> : null}{item.unread_count ? <Badge tone="danger">{item.unread_count} 則未讀</Badge> : null}</div><h3 className="mt-2 truncate font-black">{item.title}</h3><p className="mt-1 line-clamp-1 text-sm text-gray-400">{item.last_message || "尚無訊息"}</p></div><div className="flex shrink-0 items-center gap-3"><p className="text-xs text-gray-500">{new Date(item.last_message_at).toLocaleString("zh-TW")}</p><span className="text-sm font-black text-[#CFFF1A]">開啟對話 →</span></div></div></Card></button>)}</div>{selected ? <ConversationModal conversation={selected} onClose={() => setSelected(null)} onChanged={load} /> : null}</>;
}
