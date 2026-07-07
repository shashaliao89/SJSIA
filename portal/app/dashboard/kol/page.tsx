"use client";

import Link from "next/link";
import { DashboardShell, PageHeader, Card } from "@/components/DashboardShell";
import { KOL_NAV } from "@/lib/nav";

export default function KolDashboardPage() {
  return (
    <DashboardShell role="kol" title="KOL Dashboard" nav={KOL_NAV}>
      <PageHeader
        title="歡迎回來"
        description="瀏覽品牌、申請合作機會與報名協會活動。"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {KOL_NAV.slice(1).map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="transition-colors hover:border-[#CFFF1A]/40">
              <h3 className="font-black text-[#CFFF1A]">{item.label}</h3>
              <p className="mt-2 text-sm text-gray-400">前往 {item.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
