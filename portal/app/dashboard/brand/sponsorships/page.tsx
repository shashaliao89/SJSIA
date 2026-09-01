"use client";

import { FormEvent, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button } from "@/components/DashboardShell";
import { ConversationList } from "@/components/ConversationList";
import { ConversationModal } from "@/components/ConversationModal";
import { BRAND_NAV } from "@/lib/nav";

export default function BrandSponsorshipMatchingPage(){
 const {token}=useAuth(); const [tab,setTab]=useState<"seek"|"offer"|"cases">("seek"); const [submitting,setSubmitting]=useState(false); const [conversation,setConversation]=useState<Conversation|null>(null);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setSubmitting(true);try{const fd=new FormData(event.currentTarget);const payload={...Object.fromEntries(fd.entries()),direction:tab,quantity:Number(fd.get("quantity"))};const d=await api<{conversation:Conversation}>("/api/conversations/sponsorship",{method:"POST",token,body:JSON.stringify(payload)});setConversation(d.conversation);setTab("cases");}catch(e){alert(e instanceof ApiError?e.message:"案件建立失敗");}finally{setSubmitting(false);}}
 return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}><PageHeader title="贊助品媒合" description="提出活動贊助需求，或提供品牌產品資源，由協會協助尋找合適的活動與合作對象。"/><div className="mb-7 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">{[["seek","尋求贊助品"],["offer","提供贊助品"],["cases","我的贊助案件"]].map(([key,label])=><button key={key} onClick={()=>setTab(key as typeof tab)} className={`rounded-xl px-2 py-3 text-xs font-black sm:text-sm ${tab===key?"bg-[#CFFF1A] text-black":"text-gray-400"}`}>{label}</button>)}</div>
 {tab!=="cases"?<><section className="mb-6 rounded-3xl border border-[#CFFF1A]/20 bg-[#CFFF1A]/[0.06] p-5"><h2 className="text-xl font-black">{tab==="seek"?"我正在尋找活動贊助品":"我可以提供品牌贊助品"}</h2><p className="mt-2 text-sm text-gray-400">{tab==="seek"?"例如：郵輪活動需要 1,000 份免費體驗品，鎖定運動健康消費者。":"例如：提供 1,000 包乳清隨手包，希望媒合運動活動與目標客群。"}</p></section><Card><form key={tab} onSubmit={submit} className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field name="title" label="案件名稱"/><Field name="item" label="品項／服務"/><div><label htmlFor="quantity">數量</label><input id="quantity" name="quantity" type="number" min="1" max="1000000" required/></div><Field name="expected_value" label="預算或期待價值"/><Field name="event_type" label="活動類型"/><Field name="industry" label="產業類型"/><Field name="available_date" label={tab==="seek"?"需要日期":"可提供日期"}/></div><TextField name="target_audience" label="目標客群"/><TextField name="logistics" label="物流與合作條件"/><TextField name="description" label="詳細說明"/><Button type="submit" disabled={submitting}>{submitting?"建立案件中…":"送出並開啟聊天室"}</Button></form></Card></>:<ConversationList types={["sponsorship_seek","sponsorship_offer"]} emptyMessage="目前尚無贊助品媒合案件"/>}{conversation?<ConversationModal conversation={conversation} onClose={()=>setConversation(null)}/>:null}</DashboardShell>;
}
function Field({name,label}:{name:string;label:string}){return <div><label htmlFor={name}>{label}</label><input id={name} name={name} required maxLength={500}/></div>}
function TextField({name,label}:{name:string;label:string}){return <div><label htmlFor={name}>{label}</label><textarea id={name} name={name} rows={3} required maxLength={2000}/></div>}
