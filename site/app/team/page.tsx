"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { SitePageIntro } from "@/app/_components/SitePageIntro";

const TEAM_MEMBERS = [
  {
    name: "Peeta",
    title: "協會理事長",
    image: "/campaign/peeta.png",
    bio: "健身與營養學KOL，創立 STEPX 健身房與 STEPV 補給品牌。",
  },
  {
    name: "Lance",
    title: "BlueX Trade 創辦人",
    image: "/campaign/lance.jpeg",
    bio: "專注貿易交易與策略，結合運動與投資思維打造跨域影響力。",
  },
  {
    name: "Ian（Dodoman）",
    title: "百萬旅遊／運動 YouTuber",
    image: "/team/Ian.png",
    bio: "結合旅遊與運動內容，打造高影響力自媒體品牌。",
  },
  {
    name: "Emily",
    title: "健身領域指標級KOL",
    image: "/team/Emily.png",
    bio: "以專業訓練與影響力，推動女性健身文化成長。",
  },
  {
    name: "Renny",
    title: "LAVA 鐵人三項負責人",
    image: "/campaign/renny.jpg",
    bio: "主導大型鐵人三項賽事，致力打造台灣耐力運動生態圈。",
  },
  {
    name: "Jeffrey Han",
    title: "海碩集團／夢想家籃球／網球協會",
    image: "/campaign/jeffrey.jpg",
    bio: "橫跨職業運動與賽事經營，整合籃球與網球資源。",
  },
  {
    name: "Judy&Fei",
    title: "Nournow健康生活媒體／悅日國際",
    image: "/campaign/nournow.png",
    bio: "打造健康生活內容平台，連結運動與生活風格。",
  },
  {
    name: "達達運動",
    title: "運動社交平台",
    image: "/campaign/達達.jpeg",
    bio: "建立運動社群連結，促進用戶互動與活動參與。",
  },
  {
    name: "Jimmy",
    title: "HYROX 台灣區負責人",
    image: "/campaign/hyrox_tw.png",
    bio: "引進國際功能性體能賽事 HYROX，推廣混合體能運動。",
  },
  {
    name: "Terry",
    title: "VERVE 運動服飾品牌",
    image: "/campaign/verve.jpeg",
    bio: "專注機能與風格兼具的運動服飾設計。",
  },
  {
    name: "Jeffrey 陳",
    title: "Agugu 高蛋白品牌創辦人",
    image: "/campaign/agugu.png",
    bio: "推動運動營養品牌發展，專注健康補給市場。",
  },
  {
    name: "陳建平",
    title: "奧林匹克委員會副主席",
    image: "/campaign/logo.PNG",
    bio: "深耕體育政策與國際賽事發展，推動台灣運動產業升級。",
  },
  {
    name: "丁豪",
    title: "老天鵝娛樂",
    image: "/campaign/lao-tian-e.png",
    bio: "積極推廣匹克球運動，拓展新興運動市場。",
  },
] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55 },
  },
};

const fadeInReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export default function TeamPage() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const cardVariants = shouldReduceMotion ? fadeInReduced : fadeInUp;

  return (
    <div className="bg-[#0A0A0A] text-white">
      <section id="team" className="scroll-mt-28 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SitePageIntro eyebrow="CORE TEAM" title="協會理事介紹" />
          <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TEAM_MEMBERS.map((member) => (
              <motion.div
                key={member.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-8%" }}
                variants={cardVariants}
                whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                className="site-card flex h-full min-h-0 flex-col p-5 text-left transition-colors hover:border-white/20"
              >
                <div className="relative mb-4 aspect-square w-20 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <div
                    className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0A0A0A]/55 via-transparent to-[#CFFF1A]/10"
                    aria-hidden
                  />
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <p className="break-words text-lg font-black leading-snug tracking-tight">
                  {member.name}｜{member.title}
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-300">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
