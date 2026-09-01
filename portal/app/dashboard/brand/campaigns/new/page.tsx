"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, DashboardShell, PageHeader } from "@/components/DashboardShell";
import { BRAND_NAV } from "@/lib/nav";
import type { MarketingBenefit } from "@/lib/types";

const templates = {
  "30k": {
    name: "3 萬方案", subtitle: "會員社群／精緻體驗", budget: "NT$ 30,000",
    recommendedFor: "首次測試運動健康市場、產品體驗或建立精準合作名單",
    reference: "簡報案例包含匹克球、飛盤、淨灘及 STEPV 品牌體驗；實際人數與產出依活動形式確認。",
    goal: "讓品牌自然進入協會創作者與會員社群，完成精準產品體驗、關係建立與初步內容累積",
    audience: "運動、健身、Lifestyle 創作者；品牌代表、教練、場館與品牌指定目標客群",
    period: "單場合作，建議預留 4–6 週企劃與招募",
    platforms: "Instagram、實體活動",
    formats: "協會成員交流、品牌產品體驗、社群標記、活動照片或短影音素材",
    kpi: "參與人次、產品體驗數、有效合作名單、社群內容數與活動觸及",
    notes: "希望優先確認活動主題、目標受眾、產品體驗方式，以及品牌可提供的產品或場地資源。",
  },
  "200k": {
    name: "20 萬方案", subtitle: "季度整合專案", budget: "NT$ 200,000",
    recommendedFor: "需要持續曝光、不同合作場景與多位創作者協作的品牌",
    reference: "以簡報中的會員交流、品牌專屬體驗、KOL 內容與名單轉換模式進行季度組合；場次由協會評估。",
    goal: "建立一季的品牌合作節奏，串聯會員交流、品牌體驗與創作者內容，持續累積精準名單與品牌聲量",
    audience: "依品牌產品鎖定運動、健身、戶外、旅遊、健康生活或 Lifestyle 垂直族群",
    period: "季度合作，約 3 個月",
    platforms: "Instagram、實體活動；可依受眾加入 YouTube 或 TikTok",
    formats: "會員交流、品牌專屬體驗、KOL 內容製作、產品試用、社群導流與名單蒐集",
    kpi: "活動參與與體驗人次、有效名單、內容產出、累積觸及、互動與後續洽談數",
    notes: "請協會依品牌目標建議活動組合、創作者名單、場次與預算配置；所有規模與產出確認後執行。",
  },
  "500k": {
    name: "50 萬方案", subtitle: "大型整合／年度前導", budget: "NT$ 500,000",
    recommendedFor: "新品上市、年度主題、需要較高密度聲量與名單轉換的品牌",
    reference: "參考簡報的大型曝光、品牌專屬合作、高頻社群活動與六種合作模式，規劃整合型專案。",
    goal: "打造具主題性的整合專案，串聯實體體驗、創作者內容、品牌曝光與名單轉換，形成可延伸的年度合作資產",
    audience: "依品牌策略鎖定高消費運動、功能性健身、跑步、戶外旅遊、健康生活或指定市場族群",
    period: "大型專案或年度前導，建議 4–6 個月",
    platforms: "Instagram、YouTube、TikTok、實體活動與品牌自有渠道",
    formats: "品牌主題活動、活動冠名或共同主辦、KOL 系列內容、產品體驗、影音素材、名單與後續導流",
    kpi: "參與人次、精準名單、品牌曝光、內容產出、總觸及、互動、導流與商業轉換",
    notes: "請協會依目標拆分企劃、場地、招募、創作者、內容與媒體預算；大型活動規模與權益另案確認。",
  },
} as const;

export default function NewMarketingRequestPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<keyof typeof templates>("30k");
  const [submitting, setSubmitting] = useState(false);
  const [benefit, setBenefit] = useState<MarketingBenefit | null>(null);
  const template = templates[selected];

  useEffect(() => {
    api<MarketingBenefit>("/api/conversations/marketing-benefit", { token })
      .then((data) => {
        setBenefit(data);
        if (data.used) setSelected("200k");
      })
      .catch(() => setBenefit(null));
  }, [token]);

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
    <PageHeader title="發起客製化行銷需求" description="參考協會招商簡報選擇接近需求的預算規模，再依品牌目標調整；預設內容是規劃起點，實際規模與產出將由協會確認。" />
    <div className="mb-6 grid gap-3 md:grid-cols-3">
      {Object.entries(templates).map(([key, item]) => {
        const unavailable = key === "30k" && benefit?.used;
        return <button key={key} type="button" disabled={unavailable} onClick={() => setSelected(key as keyof typeof templates)} className={`rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${selected === key ? "border-[#CFFF1A] bg-[#CFFF1A]/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}><div className="flex items-start justify-between gap-2"><p className="text-xl font-black">{item.name}</p>{key === "30k" ? <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${unavailable ? "bg-white/10 text-gray-400" : "bg-[#CFFF1A] text-black"}`}>{unavailable ? "權益已使用" : "會員專屬 1 次"}</span> : null}</div><p className="mt-1 text-sm font-bold text-gray-300">{item.subtitle}</p><p className="mt-3 text-xs leading-relaxed text-gray-500">{item.recommendedFor}</p></button>;
      })}
    </div>
    <section className="mb-6 rounded-2xl border border-[#CFFF1A]/20 bg-[#CFFF1A]/[0.06] p-5">
      <p className="text-xs font-black tracking-widest text-[#CFFF1A]">方案參考依據</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">{template.reference}</p>
      <a href="https://docs.google.com/presentation/d/1l5HiG65Ft4K0WLRruK8DxtcBoN-J8rYvJIFEq8QUTG4/edit?usp=sharing" target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-black text-[#CFFF1A] hover:underline">查看團體會員方案簡報 ↗</a>
    </section>
    <Card><form key={selected} onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2"><Field label="品牌及產品" name="brand_product" /><Field label="產業類型" name="industry" /><Field label="執行期間" name="period" defaultValue={template.period} /><Field label="希望平台" name="platforms" defaultValue={template.platforms} /><Field label="內容形式" name="content_formats" defaultValue={template.formats} /><Field label="預算" name="budget" defaultValue={template.budget} /></div>
      <TextField label="行銷目標" name="marketing_goal" defaultValue={template.goal} /><TextField label="目標受眾" name="target_audience" defaultValue={template.audience} /><TextField label="預期 KPI" name="expected_kpi" defaultValue={template.kpi} /><TextField label="補充需求" name="notes" defaultValue={template.notes} required={false} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => router.push("/dashboard/brand/conversations")}>取消</Button><Button type="submit" disabled={submitting}>{submitting ? "建立案件中…" : "送出需求並建立案件"}</Button></div>
    </form></Card>
  </DashboardShell>;
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) { return <div><label htmlFor={name}>{label}</label><input id={name} name={name} required maxLength={500} defaultValue={defaultValue} /></div>; }
function TextField({ label, name, defaultValue, required = true }: { label: string; name: string; defaultValue?: string; required?: boolean }) { return <div><label htmlFor={name}>{label}</label><textarea id={name} name={name} rows={3} required={required} maxLength={2000} defaultValue={defaultValue} /></div>; }
