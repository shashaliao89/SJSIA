"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation, SponsorshipOpportunity } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { ConversationList } from "@/components/ConversationList";
import { ConversationModal } from "@/components/ConversationModal";
import { BRAND_NAV } from "@/lib/nav";

const templates = {
  "30k": { name:"3 萬方案", subtitle:"單次合作測試", budget:"NT$ 30,000", goal:"以單次創作者合作測試市場反應與內容方向", period:"1–2 個月", platforms:"Instagram", formats:"Reels、圖文或限時動態", kpi:"觸及、互動率、導流成效" },
  "200k": { name:"20 萬方案", subtitle:"季度整合專案", budget:"NT$ 200,000", goal:"規劃季度內容節奏，整合多位創作者與活動曝光", period:"3 個月", platforms:"Instagram、YouTube、TikTok", formats:"短影音、圖文、活動出席、導購", kpi:"品牌聲量、有效觸及、互動與轉換" },
  "500k": { name:"50 萬方案", subtitle:"年度／大型活動整合", budget:"NT$ 500,000", goal:"建立年度運動健康行銷主題，整合創作者、活動與社群資源", period:"6–12 個月", platforms:"Instagram、YouTube、TikTok、線下活動", formats:"系列影音、品牌大使、活動整合、導購專案", kpi:"年度觸及、品牌認知、名單與營收轉換" },
} as const;

function dateRange(item:SponsorshipOpportunity){const f=(v:string)=>v.slice(0,10).replaceAll("-", ".");return `${f(item.start_date)}—${f(item.end_date)}`;}

export default function BrandCommercialPage(){
  const {token}=useAuth(); const [tab,setTab]=useState<"opportunities"|"request"|"cases">("opportunities");
  const [opportunities,setOpportunities]=useState<SponsorshipOpportunity[]>([]); const [loading,setLoading]=useState(true); const [submitting,setSubmitting]=useState(false); const [selectedTemplate,setSelectedTemplate]=useState<keyof typeof templates>("30k"); const [conversation,setConversation]=useState<Conversation|null>(null);
  const load=async()=>{const d=await api<{opportunities:SponsorshipOpportunity[]}>("/api/sponsorships",{token});setOpportunities(d.opportunities);};
  useEffect(()=>{load().catch(()=>setOpportunities([])).finally(()=>setLoading(false));},[token]);
  useEffect(()=>{const view=new URLSearchParams(window.location.search).get("view");if(view==="request"||view==="cases")setTab(view);},[]);
  async function interest(item:SponsorshipOpportunity){setSubmitting(true);try{if(item.interested){await api(`/api/sponsorships/${item.slug}/interest`,{method:"DELETE",token});await load();}else{const d=await api<{conversation_id:string}>(`/api/sponsorships/${item.slug}/interest`,{method:"POST",token});await load();setConversation({id:d.conversation_id,title:`商業合作：${item.title}`} as Conversation);}}catch(e){alert(e instanceof ApiError?e.message:"操作失敗");}finally{setSubmitting(false);}}
  async function submitRequest(event:FormEvent<HTMLFormElement>){event.preventDefault();setSubmitting(true);try{const fd=new FormData(event.currentTarget);const body=Object.fromEntries(fd.entries());const d=await api<{conversation:Conversation}>("/api/conversations/marketing",{method:"POST",token,body:JSON.stringify({...body,template:selectedTemplate})});setConversation(d.conversation);setTab("cases");}catch(e){alert(e instanceof ApiError?e.message:"需求送出失敗");}finally{setSubmitting(false);}}
  const template=templates[selectedTemplate];
  return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}><PageHeader title="商業合作機會" description="瀏覽協會主動策劃的合作提案；品牌客製化需求請由「我的案件」發起並持續追蹤。" />
    <div className="mb-7 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">{[["opportunities","商業合作提案"],["request","客製化行銷需求"],["cases","我的案件"]].map(([key,label])=><button key={key} onClick={()=>setTab(key as typeof tab)} className={`rounded-xl px-2 py-3 text-xs font-black sm:text-sm ${tab===key?"bg-[#CFFF1A] text-black":"text-gray-400 hover:bg-white/5"}`}>{label}</button>)}</div>
    {tab==="opportunities"&&(loading?<EmptyState message="載入中…"/>:opportunities.length===0?<EmptyState message="目前尚無公開商業合作提案"/>:<div className="grid gap-5 xl:grid-cols-2">{opportunities.map(item=><Card key={item.slug} className="flex h-full flex-col p-6 md:p-8"><div className="flex justify-between gap-3"><Badge tone="success">開放合作</Badge><p className="text-sm font-black text-[#CFFF1A]">{dateRange(item)}</p></div><h2 className="mt-5 text-xl font-black md:text-2xl">{item.title}</h2><p className="mt-3 flex-1 text-sm leading-relaxed text-gray-400">先查看完整合作簡報，再送出意向與協會進一步討論。</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><a href={item.deck_url} target="_blank" rel="noreferrer" className="flex-1"><Button variant="secondary" className="w-full">查看贊助合作簡報 ↗</Button></a><Button className="flex-1" variant={item.interested?"secondary":"primary"} disabled={submitting} onClick={()=>interest(item)}>{item.interested?"取消興趣":"我有興趣"}</Button></div></Card>)}</div>)}
    {tab==="request"&&<><section className="mb-6 rounded-3xl border border-[#CFFF1A]/25 bg-[#CFFF1A]/[0.07] p-5 sm:p-7"><p className="text-xs font-black tracking-widest text-[#CFFF1A]">CUSTOMIZED MARKETING</p><h2 className="mt-2 text-2xl font-black">讓協會協助規劃年度行銷預算</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-300">從目標、受眾到創作者與活動資源，先用公版快速建立方向，再依品牌需求客製調整。</p></section><div className="mb-6 grid gap-3 md:grid-cols-3">{Object.entries(templates).map(([key,item])=><button key={key} onClick={()=>setSelectedTemplate(key as keyof typeof templates)} className={`rounded-2xl border p-5 text-left ${selectedTemplate===key?"border-[#CFFF1A] bg-[#CFFF1A]/10":"border-white/10 bg-white/[0.03]"}`}><p className="text-xl font-black">{item.name}</p><p className="mt-1 text-sm text-gray-400">{item.subtitle}</p></button>)}</div><Card><form key={selectedTemplate} onSubmit={submitRequest} className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field label="品牌及產品" name="brand_product"/><Field label="產業類型" name="industry"/><Field label="執行期間" name="period" defaultValue={template.period}/><Field label="希望平台" name="platforms" defaultValue={template.platforms}/><Field label="內容形式" name="content_formats" defaultValue={template.formats}/><Field label="預算" name="budget" defaultValue={template.budget}/></div><TextField label="行銷目標" name="marketing_goal" defaultValue={template.goal}/><TextField label="目標受眾" name="target_audience"/><TextField label="預期 KPI" name="expected_kpi" defaultValue={template.kpi}/><TextField label="補充需求" name="notes" required={false}/><Button type="submit" disabled={submitting} className="w-full sm:w-auto">{submitting?"建立案件中…":"送出需求並開啟聊天室"}</Button></form></Card></>}
    {tab==="cases"&&<ConversationList types={["marketing_request","commercial_opportunity"]} emptyMessage="目前尚無商業合作案件"/>}
    {conversation?<ConversationModal conversation={conversation} onClose={()=>setConversation(null)}/>:null}
  </DashboardShell>;
}

function Field({label,name,defaultValue}:{label:string;name:string;defaultValue?:string}){return <div><label htmlFor={name}>{label}</label><input id={name} name={name} required maxLength={500} defaultValue={defaultValue}/></div>}
function TextField({label,name,defaultValue,required=true}:{label:string;name:string;defaultValue?:string;required?:boolean}){return <div><label htmlFor={name}>{label}</label><textarea id={name} name={name} rows={3} required={required} maxLength={2000} defaultValue={defaultValue}/></div>}
