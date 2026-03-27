"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Globe,
  Infinity as InfinityIcon,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SITE_VERSION } from "@/lib/site";

const FORM_URL = "https://forms.gle/A1C3eNhqE5s6LQ6f9";
const CORE_CREATORS = [
  { name: "Peeta 葛格", image: "/team/Peeta.JPEG" },
  { name: "小艾 Emily", image: "/team/Emily.png" },
  { name: "The DoDo Men Ian", image: "/team/Ian.png" },
] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55 },
  },
};

function CountUp({
  end,
  suffix = "+",
  duration = 1600,
  className,
  reducedMotion = false,
}: {
  end: number;
  suffix?: string;
  duration?: number;
  className?: string;
  reducedMotion?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(() => (reducedMotion ? end : Math.round(end * 0.2)));

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        obs.disconnect();
        const start = performance.now();
        const from = Math.round(end * 0.2);
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - t) ** 3;
          setValue(Math.round(from + (end - from) * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [duration, end, reducedMotion]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}

export function LegacyHomeClient() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.25 });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 160]);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="bg-[#0A0A0A] text-white selection:bg-[#CFFF1A] selection:text-black">
      <motion.div
        className="fixed left-0 top-18 z-40 h-[3px] w-full origin-left bg-[#CFFF1A]"
        style={{ scaleX: progress }}
      />

      {/* 1. Hero：能量入口 */}
      <section className="relative isolate min-h-[78vh] overflow-hidden px-6 pb-24 pt-28 md:pt-36">
        <motion.div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ y: heroY }}
        >
          <Image
            src="/campaign/hyrox-silhouette.svg"
            alt=""
            fill
            className="object-cover opacity-45 blur-2xl scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#00332B] via-[#00332B]/85 to-[#0A0A0A]" />
        </motion.div>
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <p className="mb-4 text-xs font-black tracking-[0.35em] text-[#D0FF00]/85">
              
            </p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl lg:text-7xl">
              <span className="block">盛家運動健康產業協會</span>
              <span className="block text-[#D0FF00]">SJSIA</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg font-bold text-white/90 md:text-2xl">
              連結影響力  放大商業價值  打造健康生活圈
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => scrollToId("about")}
                className="inline-flex items-center gap-2 rounded-full bg-[#D0FF00] px-8 py-4 text-base font-black text-[#00332B] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                了解協會 <ArrowRight size={18} />
              </button>
              <a
                href={FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-base font-black text-white hover:bg-white/5 transition-colors"
              >
                填寫線上入會申請
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 關於協會 */}
      <motion.section
        id="about"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="scroll-mt-28 px-6 py-24"
      >
        <div className="mx-auto grid max-w-7xl items-start gap-16 md:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-12%" }}
            variants={fadeInUp}
          >
            <h2 className="mb-4 text-xl font-black uppercase tracking-widest text-[#CFFF1A]">
              About SJSIA
            </h2>
            <h3 className="mb-6 text-3xl font-black leading-tight md:text-4xl">
              台灣運動產業
              <br />
              整合平台 / 信任中樞
            </h3>
            <p className="text-lg leading-relaxed text-gray-400">
              盛家協會透過數據化的平台，確保每一分影響力都能轉化為實質收益。
            </p>
            <div className="mt-10 flex flex-wrap gap-10">
              <div>
                <div className="text-4xl font-black text-[#CFFF1A]">
                  <CountUp end={100} reducedMotion={shouldReduceMotion} />
                </div>
                <div className="text-xs font-bold uppercase tracking-tighter text-gray-500">
                  目標創作者
                </div>
              </div>
              <div>
                <div className="text-4xl font-black text-[#CFFF1A]">
                  <CountUp end={50} reducedMotion={shouldReduceMotion} />
                </div>
                <div className="text-xs font-bold uppercase tracking-tighter text-gray-500">
                  深度合作品牌
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-12%" }}
            variants={fadeInUp}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[#CFFF1A]/20 p-3 text-[#CFFF1A]">
                  <Globe size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">跨域資源整合</h4>
                  <p className="text-sm text-gray-400">串接創作者、品牌、活動、媒體與賽事生態。</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[#CFFF1A]/20 p-3 text-[#CFFF1A]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">打造健康生活圈</h4>
                  <p className="text-sm text-gray-400">
                    整合訓練、健康餐飲、營養補給、旅遊等異業合作。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[#CFFF1A]/20 p-3 text-[#CFFF1A]">
                  <Users size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">專業流量變現</h4>
                  <p className="text-sm text-gray-400">提供集中、有效的合作平台，讓流量輕鬆變現。</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 2. 個人會員 Creator Power */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden bg-[#00332B] px-6 py-24"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#D0FF00]/10 blur-3xl" />
          <div className="absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-cyan-200/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(208,255,0,0.08),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_45%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
            className="space-y-4"
          >
            <p className="text-[11px] font-black tracking-[0.35em] text-[#D0FF00]">
              CREATOR POWER
            </p>
            <h3 className="text-3xl font-black leading-[1.2] text-white md:text-4xl">
              個人會員：從創作者升級商業夥伴
            </h3>
          </motion.div>

          <div className="mt-10 grid items-start gap-10 overflow-visible md:mt-12 md:grid-cols-2 md:items-stretch md:gap-14">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: -48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative z-0 order-1 aspect-[4/5] w-full self-stretch overflow-hidden md:order-1"
            >
              <Image
                src="/campaign/kol.png"
                alt=""
                fill
                className="object-cover object-center [mask-image:linear-gradient(to_right,transparent_0%,#000_12%,#000_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_12%,#000_88%,transparent_100%)]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-[35%] bg-gradient-to-r from-[#00332B] via-[#00332B]/40 to-transparent blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-[40%] bg-gradient-to-l from-[#00332B] via-[#00332B]/35 to-transparent blur-2xl"
                aria-hidden
              />
            </motion.div>
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative z-10 order-2 min-w-0 md:order-2"
            >
              <ul className="space-y-5 md:space-y-6">
                {[
                  {
                    title: "年度價值保證 (NT$ 20,000+)",
                    body:
                      "承諾年度媒合價值高於 2 萬元，透過盤點品牌業配、聯名機會，我們為您對接最合適的商業案。",
                  },
                  {
                    title: "跨界高端人脈網",
                    body:
                      "優先免費參與每年 4 次小型交流餐會與 6 次專題研討會，打破同溫層，建立跨產業的合作關係。",
                  },
                  {
                    title: "Step C 專家賦能",
                    body:
                      "與多項運動賽事、娛樂活動合作，例如：Harco、浪趴，享有優先參與權利、協助進行品牌對接。",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl bg-black/30 pl-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md md:pl-5"
                  >
                    <div className="flex gap-3 py-5 pr-4 md:gap-4 md:py-6 md:pr-5">
                      <span
                        className="mt-0.5 shrink-0 text-lg font-black leading-none text-[#D0FF00]"
                        aria-hidden
                      >
                        ■
                      </span>
                      <div className="min-w-0 space-y-3">
                        <p className="text-base font-black leading-snug text-[#D0FF00] md:text-[17px]">
                          {item.title}
                        </p>
                        <p className="text-sm font-medium leading-relaxed text-white/88 md:text-[15px]">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 3. 團體會員 Brand Synergy */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-black px-6 py-24 text-white"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
            className="space-y-4"
          >
            <p className="text-xs font-black tracking-[0.3em] text-white/50">BRAND SYNERGY</p>
            <h3 className="text-3xl font-black md:text-4xl">
              團體會員：企業的外部策略夥伴
            </h3>
          </motion.div>

          <div className="mt-10 grid items-start gap-10 overflow-visible md:mt-12 md:grid-cols-2 md:gap-14">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative z-10 order-2 min-w-0 md:order-1 md:w-[150%] md:max-w-none"
            >
              <ul className="space-y-4">
                {[
                  {
                    title: "高效能人才庫對接",
                    body: "協會建置完整的創作者數據庫，協助企業會員精準篩選高轉換率的創作者。",
                  },
                  {
                    title: "品牌深度曝光與資源消化",
                    body: "將產品精準配發給最具潛力的創作者，達成「高流量回報」的品牌佈局。",
                  },
                  {
                    title: "年度整合專案優先權",
                    body: "優先參與協會合作的大型主題活動（如 Harco、浪趴），串聯創作者同步發聲，創造短期內的爆發性品牌聲量。",
                  },
                  {
                    title: "市場洞察與決策參與",
                    body: "透過論壇與趨勢分享，掌握第一手回饋與消費者痛點，協助企業調整產品策略。",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl bg-white/5 pl-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md md:pl-5"
                  >
                    <div className="flex gap-3 py-4 pr-4 md:gap-4 md:py-5 md:pr-5">
                      <span
                        className="mt-0.5 shrink-0 text-lg font-black leading-none text-white"
                        aria-hidden
                      >
                        ■
                      </span>
                      <div className="min-w-0 space-y-2">
                        <p className="text-base font-black leading-snug text-white md:text-[17px]">
                          {item.title}
                        </p>
                        <p className="text-sm font-medium leading-relaxed text-white/88 md:text-[15px]">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative z-0 order-1 aspect-[4/5] w-full overflow-hidden md:order-2 md:h-full md:aspect-auto"
          >
            <Image
              src="/campaign/brand.png"
              alt=""
              fill
              className="object-cover object-center [mask-image:linear-gradient(to_right,transparent_0%,#000_12%,#000_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_12%,#000_88%,transparent_100%)]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-[35%] bg-gradient-to-r from-black via-black/40 to-transparent blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-[40%] bg-gradient-to-l from-black via-black/35 to-transparent blur-2xl"
              aria-hidden
            />
          </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 4. 核心運動創作者 */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-black px-6 py-20 text-white md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 space-y-3 text-center md:mb-12">
            <p className="text-xs font-black tracking-[0.3em] text-white/45">CREATOR SPOTLIGHT</p>
            <h3 className="text-3xl font-black md:text-4xl">核心運動創作者</h3>
          </div>

          <div className="overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x snap-mandatory gap-5 md:gap-6">
              {CORE_CREATORS.map((member, i) => (
                <motion.article
                  key={member.name}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8%" }}
                  transition={{ duration: 0.45, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const }}
                  className="group w-[78vw] shrink-0 snap-center sm:w-[52vw] md:w-[31%]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 78vw, (max-width: 1024px) 52vw, 31vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>
                  <p className="mt-4 text-center text-lg font-black leading-snug tracking-tight text-white">
                    {member.name}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. 底部 CTA + 資源生態地圖 */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bg-[#D0FF00] px-6 py-14 text-[#0A0A0A] md:py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <h3 className="text-3xl font-black leading-tight md:text-5xl">
              準備好放大你的影響力了嗎？
            </h3>
            <p className="mt-4 max-w-2xl text-lg font-bold text-[#0A0A0A]/85">
              完成線上申請，讓協會窗口與你銜接下一步。
            </p>
            <a
              href={FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-9 py-3.5 text-base font-black text-[#D0FF00] transition-transform hover:scale-[1.02] md:mt-8 md:px-10 md:py-4 md:text-lg"
            >
              填寫線上入會申請 <ChevronRight size={22} />
            </a>
          </div>
        </div>
        <div className="border-t border-black/10 bg-black px-6 py-14 text-white md:py-16">
          <div className="mx-auto max-w-5xl text-center">
            <motion.div
              initial={shouldReduceMotion ? false : { scale: 0.92, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto mb-6 flex items-center justify-center gap-5 text-[#D0FF00] sm:mb-7 sm:gap-6"
            >
              <span className="hidden text-sm font-black tracking-widest text-white/40 sm:inline">
                BRAND
              </span>
              <InfinityIcon className="h-16 w-16 sm:h-24 sm:w-24" strokeWidth={1.25} />
              <span className="hidden text-sm font-black tracking-widest text-white/40 sm:inline">
                CREATOR
              </span>
            </motion.div>
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-2xl font-black md:text-4xl">The Ecosystem</h3>
              <p className="mx-auto max-w-2xl text-lg font-bold leading-relaxed text-[#D0FF00]">
                在這裡，資源不再孤立，價值開始流動。
              </p>
            </div>
          </div>
        </div>
      </motion.section>

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
