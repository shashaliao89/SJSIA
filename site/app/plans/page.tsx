"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { SitePageIntro } from "@/app/_components/SitePageIntro";
import { FORM_URL, IG_OFFICIAL_URL } from "@/lib/contact";

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
    <div className="bg-[#0A0A0A] text-white">
      <section id="plans" className="scroll-mt-28 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SitePageIntro
            eyebrow="MEMBERSHIP"
            title="入會方案"
            description="選擇最適合你現階段需求的會員方案。"
          />
          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              className="site-card p-10"
            >
              <p className="mb-3 font-black text-[#CFFF1A]">個人會員</p>
              <h3 className="mb-2 text-4xl font-black">NT$ 3,000</h3>
              <p className="mb-6 text-gray-400">常年會費：NT$ 3,000 / 年</p>
              <ul className="mb-8 space-y-3 font-medium text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="shrink-0 text-[#CFFF1A]" size={18} /> 年度媒合價值保證 2 萬以上
                </li>
                <li className="flex items-center gap-2">
                  <Check className="shrink-0 text-[#CFFF1A]" size={18} /> 每月小型交流餐會優先參與
                </li>
                <li className="flex items-center gap-2">
                  <Check className="shrink-0 text-[#CFFF1A]" size={18} /> 資源媒合與曝光機會
                </li>
              </ul>
              <a
                href={FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#CFFF1A] px-6 py-3 font-black text-[#0A0A0A] transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
              className="site-card site-card-highlight p-10"
            >
              <p className="mb-3 font-black text-[#CFFF1A]">企業團體會員</p>
              <h3 className="mb-2 text-4xl font-black">NT$ 30,000</h3>
              <p className="mb-6 text-gray-300">+ 7 萬等值物資或資源贊助</p>
              <ul className="mb-8 space-y-3 font-medium text-gray-200">
                <li className="flex items-center gap-2">
                  <Check className="shrink-0 text-[#CFFF1A]" size={18} /> 年度整合專案優先對接
                </li>
                <li className="flex items-center gap-2">
                  <Check className="shrink-0 text-[#CFFF1A]" size={18} /> 品牌曝光與活動共創
                </li>
                <li className="flex items-center gap-2">
                  <Check className="shrink-0 text-[#CFFF1A]" size={18} /> 指定窗口專案管理
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

      <SiteFooter />
    </div>
  );
}
