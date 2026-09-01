"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FOLLOWER_TIERS, followerTier, formatFollowers } from "@/lib/kolTiers";
import type { Conversation, FollowerTier, KolProfile } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { ConversationModal } from "@/components/ConversationModal";
import { BRAND_NAV } from "@/lib/nav";

function initials(name: string) { return Array.from(name.trim()).slice(0, 2).join("").toUpperCase(); }

export default function BrandKolsPage() {
  const { token } = useAuth();
  const [kols, setKols] = useState<KolProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<FollowerTier | "all">("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [contacting, setContacting] = useState<KolProfile | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const data = await api<{ kols: KolProfile[] }>("/api/kols", { token });
    setKols(data.kols);
  }
  useEffect(() => { load().catch(() => setKols([])).finally(() => setLoading(false)); }, [token]);

  const tags = useMemo(() => Array.from(new Set(kols.flatMap(kol => kol.content_types ?? []))).sort((a,b) => a.localeCompare(b,"zh-Hant")), [kols]);
  const filtered = useMemo(() => kols.filter(kol => {
    const tierMatch = selectedTier === "all" || (kol.follower_tier ?? followerTier(kol.follower_count ?? 0)) === selectedTier;
    const genderMatch = selectedGender === "all" || kol.gender === selectedGender;
    const tagMatch = selectedTags.length === 0 || selectedTags.every(tag => kol.content_types?.includes(tag));
    return tierMatch && genderMatch && tagMatch;
  }), [kols, selectedTier, selectedGender, selectedTags]);

  async function openConversation(kol: KolProfile) {
    if (!kol.conversation_id) { setContacting(kol); return; }
    setConversation({ id: kol.conversation_id, title: `洽談：${kol.name}` } as Conversation);
  }

  async function createContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!contacting) return;
    const message = String(new FormData(event.currentTarget).get("message") ?? "").trim();
    setSubmitting(true);
    try {
      const result = await api<{ conversation_id: string }>(`/api/kols/${contacting.id}/contact`, { method:"POST", token, body:JSON.stringify({ message }) });
      const name = contacting.name; setContacting(null); await load();
      setConversation({ id: result.conversation_id, title: `洽談：${name}` } as Conversation);
    } catch (error) { alert(error instanceof ApiError ? error.message : "建立洽談失敗"); }
    finally { setSubmitting(false); }
  }

  const clearFilters = () => { setSelectedTier("all"); setSelectedGender("all"); setSelectedTags([]); };
  const hasFilters = selectedTier !== "all" || selectedGender !== "all" || selectedTags.length > 0;

  return <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}>
    <PageHeader title="KOL 資料庫" description="依粉絲規模、內容定位與性別尋找合適創作者，並直接建立協會媒合對話。" />
    {loading ? <EmptyState message="載入中…" /> : kols.length === 0 ? <EmptyState message="目前尚無公開 KOL 資料" /> : <>
      <section className="mb-7 rounded-3xl border border-[#CFFF1A]/20 bg-gradient-to-br from-[#CFFF1A]/10 to-white/[0.02] p-4 sm:p-6" aria-label="KOL 篩選器">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-black">篩選合適 KOL</h2><p className="mt-1 text-xs text-gray-400">目前顯示 {filtered.length}／{kols.length} 位</p></div>{hasFilters ? <button onClick={clearFilters} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-gray-300">清除全部</button> : null}</div>
        <div className="mt-5 space-y-5">
          <div><p className="mb-2 text-xs font-black text-gray-400">粉絲數</p><div className="flex flex-wrap gap-2"><FilterButton active={selectedTier === "all"} onClick={() => setSelectedTier("all")}>全部</FilterButton>{FOLLOWER_TIERS.map(tier => <FilterButton key={tier.key} active={selectedTier === tier.key} onClick={() => setSelectedTier(tier.key)}>{tier.label}</FilterButton>)}</div></div>
          <div><p className="mb-2 text-xs font-black text-gray-400">性別</p><div className="flex flex-wrap gap-2">{["all","女性","男性","其他","不公開"].map(gender => <FilterButton key={gender} active={selectedGender === gender} onClick={() => setSelectedGender(gender)}>{gender === "all" ? "全部" : gender}</FilterButton>)}</div></div>
          <div><p className="mb-2 text-xs font-black text-gray-400">KOL 定位標籤（可複選）</p><div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">{tags.map(tag => <FilterButton key={tag} active={selectedTags.includes(tag)} onClick={() => setSelectedTags(current => current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag])}>{tag}</FilterButton>)}</div></div>
        </div>
      </section>
      {filtered.length === 0 ? <EmptyState message="沒有符合目前篩選條件的 KOL" /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map(kol => <Card key={kol.id} className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-white/10 to-black">
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white/25">{initials(kol.name)}</div>
          {kol.avatar_url ? <img src={kol.avatar_url} alt={`${kol.name} 大頭照`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={event => { event.currentTarget.style.display="none"; }} /> : null}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4"><h3 className="text-xl font-black text-white">{kol.name}</h3><p className="mt-1 text-sm font-bold text-[#CFFF1A]">{formatFollowers(kol.follower_count)} 粉絲</p></div>
        </div>
        <div className="flex flex-1 flex-col p-5">{kol.content_types?.length ? <div className="flex flex-wrap gap-2">{kol.content_types.slice(0,5).map(tag => <Badge key={tag}>{tag}</Badge>)}</div> : null}<div className="mt-4 flex-1">{kol.ig_url ? <a href={kol.ig_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#CFFF1A] hover:underline">查看 Instagram ↗</a> : <span className="text-sm text-gray-600">Instagram 待補</span>}</div><Button className="mt-5 w-full" disabled={!kol.open_to_contact} variant={kol.contacted ? "secondary" : "primary"} onClick={() => openConversation(kol)}>{kol.contacted ? "已聯繫過" : "聯繫／洽談申請"}</Button></div>
      </Card>)}</div>}
    </>}
    {contacting ? <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"><Card className="w-full max-w-lg rounded-b-none sm:rounded-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-black">聯繫 {contacting.name}</h2><button onClick={() => setContacting(null)} className="text-2xl" aria-label="關閉">×</button></div><p className="mt-2 text-sm text-gray-400">請簡述合作方向，送出後可在聊天室持續與協會討論。</p><form onSubmit={createContact} className="mt-5"><textarea name="message" rows={5} maxLength={4000} required defaultValue="希望進一步洽談合作，想請協會協助了解合作方式與檔期。" /><Button type="submit" className="mt-4 w-full" disabled={submitting}>{submitting ? "建立中…" : "送出並開啟聊天室"}</Button></form></Card></div> : null}
    {conversation ? <ConversationModal conversation={conversation} onClose={() => setConversation(null)} onChanged={load} /> : null}
  </DashboardShell>;
}

function FilterButton({ active, onClick, children }: { active:boolean; onClick:()=>void; children:React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-xl px-3.5 py-2 text-sm font-black transition ${active ? "bg-[#CFFF1A] text-black" : "border border-white/10 bg-black/20 text-gray-300 hover:border-[#CFFF1A]/40"}`}>{children}</button>;
}
