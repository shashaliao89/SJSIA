import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "入會方案與會費",
  description: "查看盛家運動健康產業協會 SJSIA 個人會員與企業團體會員方案、會費、會員權益及申請方式。",
  alternates: { canonical: "/plans" },
  openGraph: {
    title: "入會方案｜盛家運動健康產業協會",
    description: "加入運動創作者與品牌合作生態圈，查看個人及企業團體會員權益。",
    url: "/plans",
  },
};

export default function PlansLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
