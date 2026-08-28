import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peeta 與協會核心成員",
  description: "認識盛家健康發展協會 SJSIA 理事長 Peeta 與核心成員，團隊涵蓋健身營養、健康品牌、旅遊、賽事與運動產業。",
  alternates: { canonical: "/team" },
  openGraph: {
    title: "Peeta 與核心成員｜盛家健康發展協會",
    description: "由 Peeta 擔任理事長，集結健身營養、健康品牌、運動內容與賽事經營領域的核心團隊。",
    url: "/team",
  },
};

const peetaJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://sjsia.org/team#peeta",
  name: "Peeta",
  alternateName: "Peeta 葛格",
  jobTitle: "盛家健康發展協會理事長",
  image: "https://sjsia.org/campaign/peeta.png",
  url: "https://sjsia.org/team",
  sameAs: ["https://www.instagram.com/peeta.gege/"],
  worksFor: {
    "@type": "Organization",
    "@id": "https://sjsia.org/#organization",
    name: "盛家健康發展協會",
  },
  knowsAbout: ["健身", "營養", "運動健康", "健康產業", "品牌經營"],
};

export default function TeamLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(peetaJsonLd) }}
      />
      {children}
    </>
  );
}
