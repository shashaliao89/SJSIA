"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { SITE_VERSION } from "@/lib/site";

const TEAM_MEMBERS = [
  {
    name: "Peeta葛格",
    title: "協會理事長",
    image: "/team/Peeta.JPEG",
    bio: "健身與飲食內容創作者，推廣科學化體態管理。",
  },
  { name: "理事 02", title: "常務理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 03", title: "常務理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 04", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 05", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 06", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 07", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 08", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 09", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 10", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 11", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 12", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
  { name: "理事 13", title: "理事", image: "/campaign/logo.PNG", bio: "專長待補，協助協會推動跨域合作與計畫執行。" },
] as const;

export default function TeamPage() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  const titleVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.35 } } }
    : {
        hidden: { opacity: 0, y: -28, filter: "blur(10px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
        },
      };

  const gridContainerVariants = {
    hidden: {},
    visible: {
      transition: shouldReduceMotion
        ? {}
        : { staggerChildren: 0.16, delayChildren: 0.12 },
    },
  };

  const cardVariants = {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : {
          opacity: 0,
          y: 56,
          scale: 0.88,
          rotateX: 8,
          filter: "blur(12px)",
        },
    visible: (i: number) =>
      shouldReduceMotion
        ? { opacity: 1, transition: { duration: 0.35 } }
        : {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            filter: "blur(0px)",
            transition: {
              type: "spring" as const,
              stiffness: 120,
              damping: 16,
              mass: 0.85,
              delay: i * 0.04,
            },
          },
  };

  return (
    <div className="bg-[#0A0A0A] text-white selection:bg-[#CFFF1A] selection:text-black">
      {/* 核心成員 */}
      <section id="team" className="scroll-mt-28 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.h2
            className="mb-14 text-center text-4xl font-black md:text-5xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-8%" }}
            variants={titleVariants}
          >
            協會理事介紹
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            style={{ perspective: 1200 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-12%" }}
            variants={gridContainerVariants}
          >
            {TEAM_MEMBERS.map((member, i) => (
              <motion.div
                key={member.name}
                custom={i}
                variants={cardVariants}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left"
                style={{ transformStyle: "preserve-3d" }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : { y: -4, transition: { type: "spring", stiffness: 400, damping: 22 } }
                }
              >
                <motion.div
                  className="relative mb-4 aspect-square w-20 overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  initial={false}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          boxShadow: [
                            "0 0 0 rgba(207,255,26,0)",
                            "0 0 40px rgba(207,255,26,0.25)",
                            "0 0 0 rgba(207,255,26,0)",
                          ],
                        }
                  }
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : { duration: 2.2, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }
                  }
                >
                  {!shouldReduceMotion ? (
                    <motion.div
                      className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0A0A0A]/55 via-transparent to-[#CFFF1A]/10"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.15 + i * 0.08 }}
                    />
                  ) : null}
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </motion.div>
                <motion.p
                  className="break-words text-lg font-black leading-snug tracking-tight"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.2 + i * 0.1 }}
                >
                  {member.name}｜{member.title}
                </motion.p>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">{member.bio}</p>
              </motion.div>
            ))}
          </motion.div>
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
