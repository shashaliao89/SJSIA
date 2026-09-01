"use client";

import { DashboardShell, PageHeader } from "@/components/DashboardShell";
import { ConversationList } from "@/components/ConversationList";
import { BRAND_NAV } from "@/lib/nav";

export default function BrandConversationsPage() {
  return <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}><PageHeader title="我的案件" description="查看所有洽談、行銷規劃與贊助媒合歷史，協會回覆會自動更新。" /><ConversationList /></DashboardShell>;
}
