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
import { SiteFooter } from "@/app/_components/SiteFooter";
import { FORM_URL } from "@/lib/contact";
const CORE_CREATORS = [
  { name: "Peeta", image: "/creators/peeta.png", instagram: "https://www.instagram.com/peeta.gege/" },
  { name: "Ian Lee", image: "/creators/ian-lee.png", instagram: "https://www.instagram.com/ilee0223/" },
  {
    name: "小艾 Emily",
    image: "/creators/emily.png",
    instagram: "https://www.instagram.com/emline_fitness_diary/",
  },
  {
    name: "小豬 黃沐妍",
    image: "/creators/pig.png",
    instagram: "https://www.instagram.com/tystarpiggggg/",
  },
  { name: "得得", image: "/creators/deded.png", instagram: "https://www.instagram.com/david_der_der/" },
  { name: "寶尼", image: "/creators/bonnie.png", instagram: "https://www.instagram.com/bonnie__ding/" },
  { name: "泰雅", image: "/creators/tayal.png", instagram: "https://www.instagram.com/tayaltali/" },
  {
    name: "阿吉警官",
    image: "/creators/aji.png",
    instagram: "https://www.instagram.com/huangluck?igsh=aGRmYWY3cGRrMDhq&utm_source=qr",
  },
  { name: "Audrey", image: "/creators/audrey.png", instagram: "https://www.instagram.com/audrey_kuan0826/" },
  { name: "Jeffrey", image: "/creators/jeffrey.png", instagram: "https://www.instagram.com/jeffrey0932/" },
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
      {value.toLocaleString()}
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
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <p className="site-eyebrow mb-4 tracking-[0.35em]">
              SHENG JIA SPORTS &amp; HEALTH
            </p>
            <h1 className="text-4xl font-black leading-[1.1] md:text-6xl lg:text-7xl">
              <span className="block">盛家運動健康產業協會</span>
              <span className="block text-[#CFFF1A]">SJSIA</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-relaxed text-white/90 md:mt-8 md:text-xl">
              連結影響力 · 放大商業價值 · 打造健康生活圈
            </p>
            <div className="mt-8 flex flex-wrap gap-3 md:mt-10 md:gap-4">
              <button
                type="button"
                onClick={() => scrollToId("about")}
                className="inline-flex items-center gap-2 rounded-full bg-[#CFFF1A] px-6 py-3.5 text-sm font-black text-[#00332B] transition-transform hover:scale-[1.02] active:scale-[0.98] md:px-8 md:py-4 md:text-base"
              >
                了解協會 <ArrowRight size={18} />
              </button>
              <a
                href={FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-black text-white transition-colors hover:bg-white/5 md:px-8 md:py-4 md:text-base"
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
            <h3 className="mb-6 text-3xl font-black leading-tight md:text-4xl lg:text-5xl">
              台灣運動產業
              <br />
              整合平台 / 信任中樞
            </h3>
            <p className="text-base leading-relaxed text-gray-400 md:text-lg">
              盛家協會透過數據化的平台，確保每一分影響力都能轉化為實質收益。
            </p>
            <div className="mt-8 flex flex-wrap gap-8 md:mt-10 md:gap-12">
              <div>
                <div className="text-3xl font-black text-[#CFFF1A] md:text-4xl">
                  <CountUp end={100} reducedMotion={shouldReduceMotion} />
                </div>
                <div className="mt-1 text-sm font-bold text-gray-500">創作者</div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#CFFF1A] md:text-4xl">
                  <CountUp end={5350} suffix="k+" reducedMotion={shouldReduceMotion} />
                </div>
                <div className="mt-1 text-sm font-bold text-gray-500">觸及人數</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-12%" }}
            variants={fadeInUp}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8"
          >
            <div className="space-y-5 md:space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[#CFFF1A]/20 p-2.5 text-[#CFFF1A] md:p-3">
                  <Globe size={22} />
                </div>
                <div>
                  <h4 className="text-base font-bold md:text-lg">跨域資源整合</h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">串接創作者、品牌、活動、媒體與賽事生態。</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[#CFFF1A]/20 p-2.5 text-[#CFFF1A] md:p-3">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="text-base font-bold md:text-lg">打造健康生活圈</h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">
                    整合訓練、健康餐飲、營養補給、旅遊等異業合作。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[#CFFF1A]/20 p-2.5 text-[#CFFF1A] md:p-3">
                  <Users size={22} />
                </div>
                <div>
                  <h4 className="text-base font-bold md:text-lg">專業流量變現</h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">提供集中、有效的合作平台，讓流量輕鬆變現。</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 核心運動創作者 */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="border-t border-white/10 bg-[#0A0A0A] px-6 py-20 text-white md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 space-y-3 text-center md:mb-14">
            <p className="site-eyebrow">CREATOR SPOTLIGHT</p>
            <h3 className="text-3xl font-black md:text-4xl lg:text-5xl">核心運動創作者</h3>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0A0A0A] to-transparent sm:w-14"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0A0A0A] to-transparent sm:w-14"
              aria-hidden
            />
            <div className="overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full snap-x snap-mandatory gap-4 md:mx-auto md:gap-5">
              {CORE_CREATORS.map((member, i) => (
                <motion.article
                  key={member.name}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8%" }}
                  transition={{ duration: 0.45, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] as const }}
                  className="group w-[42vw] shrink-0 snap-center sm:w-[28vw] md:w-[200px] lg:w-[220px]"
                >
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-opacity hover:opacity-90"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        sizes="(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 220px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 to-transparent" />
                    </div>
                    <p className="mt-3 text-center text-sm font-black leading-snug tracking-tight text-white md:mt-3.5 md:text-base">
                      {member.name}
                    </p>
                  </a>
                </motion.article>
              ))}
            </div>
          </div>
          <p className="mt-5 text-center text-xs font-bold tracking-wide text-gray-500 lg:hidden">
            ← 左右滑動查看更多創作者 →
          </p>
          </div>
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
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#CFFF1A]/10 blur-3xl" />
          <div className="absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-cyan-200/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(207,255,26,0.08),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_45%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
            className="mb-8 space-y-3 md:mb-10"
          >
            <p className="site-eyebrow text-[#CFFF1A]">CREATOR POWER</p>
            <h3 className="text-3xl font-black leading-tight md:text-4xl">
              個人會員：創作者升級
            </h3>
          </motion.div>

          <div className="grid items-start gap-8 md:grid-cols-2 md:items-stretch md:gap-12 lg:gap-14">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: -48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative z-0 order-1 min-h-[20rem] w-full overflow-hidden sm:min-h-[24rem] md:order-1 md:min-h-[28rem] md:h-full lg:min-h-[32rem]"
            >
              <Image
                src="/campaign/kol.png"
                alt="協會 KOL 創作者"
                fill
                className="object-contain object-center [mask-image:linear-gradient(to_right,transparent_0%,#000_14%,#000_86%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_14%,#000_86%,transparent_100%)]"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={false}
              />
              <div
                className="pointer-events-none absolute inset-y-0 -left-4 w-[48%] bg-gradient-to-r from-[#00332B] via-[#00332B]/70 to-transparent blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 -right-4 w-[52%] bg-gradient-to-l from-[#00332B] via-[#00332B]/65 to-transparent blur-3xl"
                aria-hidden
              />
            </motion.div>
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative z-10 order-2 flex min-w-0 flex-col md:order-2 md:h-full"
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
                      "優先免費參與每年 12 場協會交流活動，打破同溫層，建立跨產業的合作關係。",
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
                        className="mt-0.5 shrink-0 text-lg font-black leading-none text-[#CFFF1A]"
                        aria-hidden
                      >
                        ■
                      </span>
                      <div className="min-w-0 space-y-3">
                        <p className="text-base font-black leading-snug text-[#CFFF1A]">
                          {item.title}
                        </p>
                        <p className="text-sm leading-relaxed text-white/85">
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
            className="mb-8 space-y-3 md:mb-10"
          >
            <p className="text-xs font-black tracking-[0.3em] text-white/50">BRAND SYNERGY</p>
            <h3 className="text-3xl font-black leading-tight md:text-4xl">
              團體會員：企業的策略夥伴
            </h3>
          </motion.div>

          <div className="max-w-4xl">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative z-10 min-w-0"
            >
              <ul className="space-y-5 md:space-y-6">
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
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl bg-white/5 pl-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md md:pl-5"
                  >
                    <div className="flex gap-3 py-5 pr-4 md:gap-4 md:py-6 md:pr-5">
                      <span
                        className="mt-0.5 shrink-0 text-lg font-black leading-none text-white"
                        aria-hidden
                      >
                        ■
                      </span>
                      <div className="min-w-0 space-y-2">
                        <p className="text-base font-black leading-snug text-white">
                          {item.title}
                        </p>
                        <p className="text-sm leading-relaxed text-white/85">
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

      {/* 底部 CTA + 資源生態地圖 */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bg-[#CFFF1A] px-6 py-14 text-[#0A0A0A] md:py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <h3 className="text-3xl font-black leading-tight md:text-4xl lg:text-5xl">
              準備好放大你的影響力了嗎？
            </h3>
            <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-[#0A0A0A]/85 md:text-lg">
              完成線上申請，讓協會窗口與你銜接下一步。
            </p>
            <a
              href={FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-9 py-3.5 text-base font-black text-[#CFFF1A] transition-transform hover:scale-[1.02] md:mt-8 md:px-10 md:py-4 md:text-lg"
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
              className="mx-auto mb-6 flex items-center justify-center gap-5 text-[#CFFF1A] sm:mb-7 sm:gap-6"
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
              <h3 className="text-2xl font-black md:text-3xl lg:text-4xl">The Ecosystem</h3>
              <p className="mx-auto max-w-2xl text-base font-bold leading-relaxed text-[#CFFF1A] md:text-lg">
                在這裡，資源不再孤立，價值開始流動。
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <SiteFooter />
    </div>
  );
}
