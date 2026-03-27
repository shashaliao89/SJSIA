import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "./_components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "盛家運動健康產業協會 SJSIA",
    template: "%s｜SJSIA",
  },
  description:
    "盛家運動健康產業協會（SJSIA）：連結創作者與品牌資源、活動公告、核心成員與入會方案。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#CFFF1A] focus:px-4 focus:py-2 focus:text-sm focus:font-black focus:text-[#0A0A0A]"
        >
          跳至主要內容
        </a>
        <TopNav />
        <main id="main-content" className="flex-1 pt-18" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
