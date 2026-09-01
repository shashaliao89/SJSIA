"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation, ConversationMessage, ConversationStatus } from "@/lib/types";
import { Badge, Button } from "./DashboardShell";

const STATUS_LABELS: Record<ConversationStatus, string> = { pending: "待處理", in_progress: "進行中", closed: "已結案" };

function MessageBody({ body }: { body: string }) {
  const parts = body.split(/(https?:\/\/[^\s]+)/g);
  return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{parts.map((part, index) =>
    /^https?:\/\//.test(part) ? <a key={index} href={part} target="_blank" rel="noreferrer" className="text-[#CFFF1A] underline">{part}</a> : part
  )}</p>;
}

export function ConversationModal({ conversation, onClose, onChanged }: {
  conversation: Conversation;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [current, setCurrent] = useState(conversation);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const data = await api<{ conversation: Conversation; messages: ConversationMessage[] }>(`/api/conversations/${conversation.id}/messages`, { token });
    setCurrent(data.conversation);
    setMessages(data.messages);
    setLoading(false);
  }, [conversation.id, token]);

  useEffect(() => {
    load().catch(() => setError("對話載入失敗"));
    const timer = window.setInterval(() => load().catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [load]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    setSending(true); setError("");
    try {
      await api(`/api/conversations/${conversation.id}/messages`, { method: "POST", token, body: JSON.stringify({ body }) });
      form.reset(); await load(); onChanged?.();
    } catch (err) { setError(err instanceof ApiError ? err.message : "訊息送出失敗"); }
    finally { setSending(false); }
  }

  async function setStatus(status: ConversationStatus) {
    await api(`/api/conversations/${conversation.id}/status`, { method: "PATCH", token, body: JSON.stringify({ status }) });
    await load(); onChanged?.();
  }

  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={current.title}>
    <div className="flex h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#111] sm:h-[80dvh] sm:rounded-3xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
        <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{current.title}</h2><Badge>{STATUS_LABELS[current.status]}</Badge>{current.withdrawn ? <Badge tone="warning">已撤回</Badge> : null}</div>{current.brand_name ? <p className="mt-1 text-xs text-gray-500">{current.brand_name} · {current.brand_email}</p> : null}</div>
        <button type="button" onClick={onClose} className="h-9 w-9 rounded-full border border-white/10 text-xl" aria-label="關閉聊天室">×</button>
      </div>
      {user?.role === "admin" ? <div className="flex gap-2 border-b border-white/10 px-4 py-3">{(["pending","in_progress","closed"] as ConversationStatus[]).map(status => <button key={status} onClick={() => setStatus(status)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${current.status === status ? "bg-[#CFFF1A] text-black" : "border border-white/10 text-gray-300"}`}>{STATUS_LABELS[status]}</button>)}</div> : null}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">{loading ? <p className="text-center text-gray-500">載入中…</p> : messages.map(message => { const mine = message.sender_user_id === user?.id; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 ${mine ? "bg-[#CFFF1A] text-black" : "bg-white/10 text-gray-100"}`}><p className="mb-1 text-[10px] font-bold opacity-60">{message.sender_role === "admin" ? "協會管理員" : "品牌會員"}</p><MessageBody body={message.body} /><p className="mt-1 text-[10px] opacity-50">{new Date(message.created_at).toLocaleString("zh-TW")}</p></div></div>; })}<div ref={bottomRef} /></div>
      <form onSubmit={send} className="border-t border-white/10 p-4"><textarea name="body" rows={2} maxLength={4000} disabled={current.status === "closed"} placeholder={current.status === "closed" ? "此案件已結案" : "輸入訊息或貼上連結…"} className="w-full resize-none" /><div className="mt-2 flex items-center justify-between"><p className="text-xs text-red-400">{error}</p><Button type="submit" disabled={sending || current.status === "closed"}>{sending ? "送出中…" : "送出訊息"}</Button></div></form>
    </div>
  </div>;
}
