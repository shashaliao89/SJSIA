"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { SITE_VERSION } from "@/lib/site";

const FORM_URL = "https://forms.gle/A1C3eNhqE5s6LQ6f9";

const IG_OFFICIAL_URL =
  "https://www.instagram.com/sjsia_tw?igsh=MW56ZXVhcm5yYnI0ZQ%3D%3D&utm_source=qr";

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55 },
  },
};

export default function PlansPage() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <div className="bg-[#0A0A0A] text-white selection:bg-[#CFFF1A] selection:text-black">
      {/* 入會方案 */}
      <section id="plans" className="scroll-mt-28 px-6 pb-24 pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-4xl font-black md:text-5xl">入會方案</h2>
            <p className="text-lg text-gray-400">選擇最適合你現階段需求的會員方案。</p>
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-md"
            >
              <p className="mb-3 font-black text-[#CFFF1A]">個人會員</p>
              <h3 className="mb-2 text-4xl font-black">NT$ 5,000</h3>
              <p className="mb-6 text-gray-400">常年會費：NT$ 5,000 / 年</p>
              <ul className="mb-8 space-y-3 font-medium text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="text-[#CFFF1A]" size={18} /> 年度媒合價值保證 2 萬以上
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-[#CFFF1A]" size={18} /> 每季小型交流餐會優先參與
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-[#CFFF1A]" size={18} /> 資源媒合與曝光機會
                </li>
              </ul>
              <a
                href={FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#CFFF1A] px-6 py-3 font-black text-[#0A0A0A]"
              >
                申請個人會員 <ArrowRight size={18} />
              </a>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              className="rounded-3xl border border-[#CFFF1A]/40 bg-[#CFFF1A]/10 p-10 backdrop-blur-md"
            >
              <p className="mb-3 font-black text-[#CFFF1A]">企業團體會員</p>
              <h3 className="mb-2 text-4xl font-black">NT$ 30,000</h3>
              <p className="mb-6 text-gray-300">+ 7 萬等值物資或資源贊助</p>
              <ul className="mb-8 space-y-3 font-medium text-gray-200">
                <li className="flex items-center gap-2">
                  <Check className="text-[#CFFF1A]" size={18} /> 年度整合專案優先對接
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-[#CFFF1A]" size={18} /> 品牌曝光與活動共創
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-[#CFFF1A]" size={18} /> 指定窗口專案管理
                </li>
              </ul>
              <a
                href={IG_OFFICIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#CFFF1A] px-6 py-3 font-black text-[#CFFF1A] transition-colors hover:bg-[#CFFF1A] hover:text-[#0A0A0A]"
              >
                聯繫企業方案 <ArrowRight size={18} />
              </a>
            </motion.div>
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
