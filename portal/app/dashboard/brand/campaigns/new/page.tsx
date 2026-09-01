"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, DashboardShell, PageHeader } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";

const templates = {
  "30k": { name: "3 萬方案", subtitle: "單次合作測試", budget: "NT$ 30,000", goal: "以單次創作者合作測試市場反應與內容方向", period: "1–2 個月", platforms: "Instagram", formats: "Reels、圖文或限時動態", kpi: "觸及、互動率、導流成效" },
  "200k": { name: "20 萬方案", subtitle: "季度整合專案", budget: "NT$ 200,000", goal: "規劃季度內容節奏，整合多位創作者與活動曝光", period: "3 個月", platforms: "Instagram、YouTube、TikTok", formats: "短影音、圖文、活動出席、導購", kpi: "品牌聲量、有效觸及、互動與轉換" },
  "500k": { name: "50 萬方案", subtitle: "年度／大型活動整合", budget: "NT$ 500,000", goal: "建立年度運動健康行銷主題，整合創作者、活動與社群資源", period: "6–12 個月", platforms: "Instagram、YouTube、TikTok、線下活動", formats: "系列影音、品牌大使、活動整合、導購專案", kpi: "年度觸及、品牌認知、名單與營收轉換" },
} as const;

export default function NewMarketingRequestPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<keyof typeof templates>("30k");
  const [submitting, setSubmitting] = useState(false);
  const template = templates[selected];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget).entries());
      await api("/api/conversations/marketing", { method: "POST", token, body: JSON.stringify({ ...body, template: selected }) });
      router.push("/dashboard/brand/conversations");
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "需求送出失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return <DashboardShell role="brand" title="品牌會員中心" nav={BRAND_NAV}>
    <PageHeader title="發起客製化行銷需求" description="選擇接近需求的預算公版，再依品牌目標調整；送出後會建立案件並由協會接續討論。" />
    <div className="mb-6 grid gap-3 md:grid-cols-3">
      {Object.entries(templates).map(([key, item]) => <button key={key} type="button" onClick={() => setSelected(key as keyof typeof templates)} className={`rounded-2xl border p-5 text-left transition ${selected === key ? "border-[#CFFF1A] bg-[#CFFF1A]/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}><p className="text-xl font-black">{item.name}</p><p className="mt-1 text-sm text-gray-400">{item.subtitle}</p></button>)}
    </div>
    <Card><form key={selected} onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2"><Field label="品牌及產品" name="brand_product" /><Field label="產業類型" name="industry" /><Field label="執行期間" name="period" defaultValue={template.period} /><Field label="希望平台" name="platforms" defaultValue={template.platforms} /><Field label="內容形式" name="content_formats" defaultValue={template.formats} /><Field label="預算" name="budget" defaultValue={template.budget} /></div>
      <TextField label="行銷目標" name="marketing_goal" defaultValue={template.goal} /><TextField label="目標受眾" name="target_audience" /><TextField label="預期 KPI" name="expected_kpi" defaultValue={template.kpi} /><TextField label="補充需求" name="notes" required={false} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => router.push("/dashboard/brand/conversations")}>取消</Button><Button type="submit" disabled={submitting}>{submitting ? "建立案件中…" : "送出需求並建立案件"}</Button></div>
    </form></Card>
  </DashboardShell>;
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) { return <div><label htmlFor={name}>{label}</label><input id={name} name={name} required maxLength={500} defaultValue={defaultValue} /></div>; }
function TextField({ label, name, defaultValue, required = true }: { label: string; name: string; defaultValue?: string; required?: boolean }) { return <div><label htmlFor={name}>{label}</label><textarea id={name} name={name} rows={3} required={required} maxLength={2000} defaultValue={defaultValue} /></div>; }
