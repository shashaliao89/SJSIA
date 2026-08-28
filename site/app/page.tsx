import type { Metadata } from "next";
import { LegacyHomeClient } from "./_components/LegacyHomeClient";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME}｜Peeta 理事長・運動健康產業平台`,
  },
  description: `${SITE_NAME} 由 Peeta 擔任理事長，串聯運動創作者、健康品牌、場館與賽事資源，提供會員活動、品牌合作、KOL 媒合與入會方案。`,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME}｜Peeta 理事長・運動健康產業平台`,
    description: `由 Peeta 擔任理事長，連結運動創作者與健康品牌，提供活動、入會及產業媒合資訊。`,
    locale: "zh_TW",
    type: "website",
    url: "/",
  },
};

export default function HomePage() {
  return <LegacyHomeClient />;
}
