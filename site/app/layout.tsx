import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "./_components/TopNav";
import { CONTACT, IG_OFFICIAL_URL } from "@/lib/contact";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sjsia.org"),
  title: {
    default: SITE_NAME,
    template: "%s｜SJSIA",
  },
  description:
    "盛家運動健康產業協會（SJSIA）：連結創作者與品牌資源、活動公告、核心成員與入會方案。",
  keywords: [
    "盛家運動健康產業協會",
    "SJSIA",
    "運動產業協會",
    "運動創作者",
    "KOL 媒合",
    "品牌合作",
    "運動活動",
    "企業會員",
  ],
  authors: [{ name: SITE_NAME, url: "https://sjsia.org" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    siteName: SITE_NAME,
    title: `${SITE_NAME}｜${SITE_TAGLINE}`,
    description: "串聯運動創作者、品牌、場館與賽事資源，創造可落地的合作機會。",
    url: "https://sjsia.org",
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}｜${SITE_TAGLINE}`,
    description: "串聯運動創作者、品牌、場館與賽事資源，創造可落地的合作機會。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://sjsia.org/#organization",
  name: "盛家運動健康產業協會",
  alternateName: "SJSIA",
  url: "https://sjsia.org",
  logo: "https://sjsia.org/campaign/logo.PNG",
  description: SITE_TAGLINE,
  email: CONTACT.email,
  telephone: CONTACT.phone,
  sameAs: [IG_OFFICIAL_URL],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
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
