import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "核心成員",
  description: "認識盛家運動健康產業協會 SJSIA 核心成員，涵蓋健身、旅遊、賽事、籃球、網球、鐵人三項與運動品牌領域。",
  alternates: { canonical: "/team" },
  openGraph: {
    title: "核心成員｜盛家運動健康產業協會",
    description: "跨足運動內容、賽事經營、品牌與產業政策的協會核心團隊。",
    url: "/team",
  },
};

export default function TeamLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
