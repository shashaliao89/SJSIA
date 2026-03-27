"use client";

import { motion } from "framer-motion";
import { CalendarDays, ChevronRight } from "lucide-react";
import { SITE_VERSION } from "@/lib/site";

const EVENT_SIGNUP_IG_URL =
  "https://www.instagram.com/sjsia_tw?igsh=MW56ZXVhcm5yYnI0ZQ%3D%3D&utm_source=qr";

const EVENTS = [
  {
    date: "2026/04/15",
    title: "KOL出團：商業合作計畫說明",
    place: "台北市松山區｜私廚美饌預約制",
    desc: "品牌方與創作者合作機會，會後提供一對一合作諮詢。",
  },
  {
    date: "2026/05/21",
    title: "運動創作者論壇：跨界合作策略",
    place: "台北市中山區｜會議廳",
    desc: "邀請合作品牌分享案例、商務提案策略。",
  },
  {
    date: "2026/06/11",
    title: "第二季協會會員交流餐會",
    place: "台北市中山區｜餐酒館",
    desc: "邀請所有入會會員一同擴展跨域合作與曝光機會。",
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

export default function EventsPage() {
  return (
    <div className="bg-[#0A0A0A] text-white selection:bg-[#CFFF1A] selection:text-black">
      {/* 活動公告 */}
      <section id="events" className="scroll-mt-28 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 text-4xl font-black md:text-5xl">協會活動公告</h2>
          <p className="mb-12 max-w-3xl text-lg text-gray-400">
            協會近期論壇、會員餐會、品牌交流與培訓活動，讓會員可快速掌握可參與時程與報名資訊。
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {EVENTS.map((event) => (
              <motion.div
                key={event.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-8%" }}
                variants={fadeInUp}
                className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-colors hover:border-[#CFFF1A]"
              >
                <div className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[#CFFF1A]">
                  <CalendarDays size={16} />
                  {event.date}
                </div>
                <h3 className="mb-3 text-2xl font-black">{event.title}</h3>
                <p className="mb-3 font-bold text-gray-300">{event.place}</p>
                <p className="leading-relaxed text-gray-400">{event.desc}</p>
                <a
                  href={EVENT_SIGNUP_IG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-2 pt-6 font-black text-[#CFFF1A] hover:opacity-80"
                >
                  我要報名 <ChevronRight size={18} />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 text-3xl font-black italic text-[#CFFF1A]">SJSIA</div>
            <p className="font-bold text-gray-500">運動產業的資源槓桿 — 連結、媒合、加速。</p>
          </div>
          <div className="grid gap-6 text-sm font-bold text-gray-400 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-white">聯絡資訊</p>
              <p>INSTAGRAM：@sjsia_tw</p>
              <p>電話：+886 936-110-527</p>
              <p>Email：wars.lee@stepc.co</p>
            </div>

          </div>
        </div>
        <p className="mx-auto mt-12 max-w-7xl text-center text-xs font-bold text-gray-600">
          © {new Date().getFullYear()} SHENG JIA SPORTS &amp; HEALTH ASSOCIATION. ALL RIGHTS RESERVED.
          <span className="mx-2 opacity-40" aria-hidden>
            ·
          </span>
          <span className="text-gray-500">網站 v{SITE_VERSION}</span>
        </p>
      </footer>
    </div>
  );
}
