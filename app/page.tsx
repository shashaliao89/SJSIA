import type { Metadata } from "next";
import { LegacyHomeClient } from "./_components/LegacyHomeClient";
import { SITE_TAGLINE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME}｜${SITE_TAGLINE}`,
  },
  description: `${SITE_NAME}：${SITE_TAGLINE} 提供協會介紹、活動公告、核心成員與入會方案。`,
  openGraph: {
    title: `${SITE_NAME}｜${SITE_TAGLINE}`,
    description: `${SITE_NAME} 官方網站：活動、入會與產業媒合資訊。`,
    locale: "zh_TW",
    type: "website",
  },
};

export default function HomePage() {
  return <LegacyHomeClient />;
}
