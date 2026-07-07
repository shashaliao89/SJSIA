"use client";

import Link from "next/link";
import { DashboardShell, PageHeader, Card } from "@/components/DashboardShell";
import { ADMIN_NAV } from "@/lib/nav";

export default function AdminDashboardPage() {
  return (
    <DashboardShell role="admin" title="Admin Dashboard" nav={ADMIN_NAV}>
      <PageHeader title="協會管理後台" description="審核會員、媒合通知、管理 KOL、合作案件與活動。" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ADMIN_NAV.slice(1).map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="transition-colors hover:border-[#CFFF1A]/40">
              <h3 className="font-black text-[#CFFF1A]">{item.label}</h3>
              <p className="mt-2 text-sm text-gray-400">管理 {item.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
