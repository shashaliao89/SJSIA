"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { SitePageIntro } from "@/app/_components/SitePageIntro";
import { IG_OFFICIAL_URL } from "@/lib/contact";

const EVENT_SIGNUP_IG_URL = IG_OFFICIAL_URL;
const BEACH_CLEANUP_FORM_URL = "https://forms.gle/2noUUndQV7vsZvR27";

type EventStatus = "past" | "current" | "upcoming";

interface SiteEvent {
  monthNum: number;
  monthLabel: string;
  dateLabel: string;
  title: string;
  subtitle?: string;
  status: EventStatus;
  signupUrl?: string;
  signupLabel?: string;
}

const MONTHLY_EVENTS: SiteEvent[] = [
  {
    monthNum: 6,
    monthLabel: "6 月",
    dateLabel: "06/05",
    title: "Private Pickleball Social",
    subtitle: "匹克球聚會",
    status: "past",
  },
  {
    monthNum: 7,
    monthLabel: "7 月",
    dateLabel: "07/08",
    title: "Private Frisbee Social",
    subtitle: "飛盤聚會",
    status: "past",
  },
  {
    monthNum: 8,
    monthLabel: "8 月",
    dateLabel: "08/01",
    title: "Private Beach Cleanup Social",
    subtitle: "公益淨灘活動",
    status: "current",
    signupUrl: BEACH_CLEANUP_FORM_URL,
    signupLabel: "點我報名",
  },
  {
    monthNum: 9,
    monthLabel: "9 月",
    dateLabel: "09/09 ~ 09/11",
    title: "STEPSEA",
    subtitle: "浪趴郵輪派對",
    status: "upcoming",
  },
  {
    monthNum: 10,
    monthLabel: "10 月",
    dateLabel: "10/17 ~ 10/18",
    title: "HARCO",
    subtitle: "八項混合運動挑戰賽",
    status: "upcoming",
  },
];

const STATUS_LABEL: Record<EventStatus, string> = {
  past: "已結束",
  current: "開放報名",
  upcoming: "即將舉辦",
};

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const fadeInReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

function StatusPill({ status }: { status: EventStatus }) {
  const styles = {
    past: "border-white/10 bg-white/[0.04] text-gray-500",
    current: "border-[#CFFF1A]/40 bg-[#CFFF1A]/15 text-[#CFFF1A]",
    upcoming: "border-white/15 bg-white/[0.06] text-gray-300",
  };
  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${styles[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function PastEventRow({
  event,
  variants,
}: {
  event: SiteEvent;
  variants: typeof fadeInUp | typeof fadeInReduced;
}) {
  const [expanded, setExpanded] = useState(false);

  const cardShell = "w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md";

  return (
    <motion.li
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={variants}
      className="relative grid grid-cols-1 md:grid-cols-[6rem_1fr]"
    >
      <div className="hidden md:flex md:items-start md:justify-center md:pt-3" aria-hidden>
        <div className="mt-1 h-2 w-2 rounded-full bg-gray-600 ring-4 ring-[#0A0A0A]" />
      </div>

      <div className="min-w-0">
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-expanded={false}
            className={`${cardShell} flex items-center gap-3 px-4 py-3 text-left opacity-80 transition-colors hover:border-white/20 hover:bg-white/[0.05] md:px-5`}
          >
            <span className="shrink-0 text-xs font-black tabular-nums text-gray-500 md:text-sm">
              {event.monthLabel}
            </span>
            <span className="shrink-0 text-xs font-bold tabular-nums text-gray-600">{event.dateLabel}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-400">{event.title}</span>
            {event.subtitle ? (
              <span className="hidden truncate text-xs text-gray-600 sm:inline sm:max-w-[6rem]">
                {event.subtitle}
              </span>
            ) : null}
            <StatusPill status="past" />
            <ChevronDown size={16} className="shrink-0 text-gray-500" aria-hidden />
          </button>
        ) : (
          <article className={`${cardShell} opacity-80`}>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-expanded
              className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] md:px-5"
            >
              <span className="shrink-0 text-xs font-black text-gray-500 md:text-sm">{event.monthLabel}</span>
              <span className="shrink-0 text-xs font-bold tabular-nums text-gray-600">{event.dateLabel}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-black text-gray-300">{event.title}</span>
              <StatusPill status="past" />
              <ChevronUp size={16} className="shrink-0 text-gray-500" aria-hidden />
            </button>
            <div className="space-y-1 px-4 py-4 md:px-5">
              {event.subtitle ? <p className="text-sm text-gray-500">{event.subtitle}</p> : null}
              <p className="text-xs text-gray-600">活動已結束，感謝參與。</p>
            </div>
          </article>
        )}
      </div>
    </motion.li>
  );
}

function TimelineRow({
  event,
  isFirst,
  isLast,
  variants,
}: {
  event: SiteEvent;
  isFirst: boolean;
  isLast: boolean;
  variants: typeof fadeInUp | typeof fadeInReduced;
}) {
  const isCurrent = event.status === "current";

  return (
    <motion.li
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-8%" }}
      variants={variants}
      className={`relative grid grid-cols-1 md:grid-cols-[6rem_1fr]`}
    >
      <div className="relative hidden md:flex md:flex-col md:items-center md:pt-10">
        {!isFirst ? (
          <div
            className={`absolute top-0 h-10 w-px -translate-y-full bg-white/15`}
            aria-hidden
          />
        ) : null}
        <div
          className={`relative z-10 h-2.5 w-2.5 rounded-full ring-4 ring-[#0A0A0A] ${
            isCurrent
              ? "bg-[#CFFF1A] shadow-[0_0_10px_rgba(207,255,26,0.5)]"
              : "bg-white/25"
          }`}
          aria-hidden
        />
        {!isLast ? (
          <div
            className="mt-3 w-px flex-1 min-h-[5rem] bg-white/15"
            aria-hidden
          />
        ) : null}
      </div>

      <article
        className={`flex min-h-[6.5rem] min-w-0 overflow-hidden rounded-3xl border backdrop-blur-md transition-colors md:min-h-[7rem] ${
          isCurrent
            ? "border-[#CFFF1A]/40 bg-[#CFFF1A]/10"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        <div
          className={`flex w-[5.5rem] shrink-0 flex-col items-center justify-center border-r px-3 md:w-[6.5rem] md:px-4 ${
            isCurrent ? "border-[#CFFF1A]/20" : "border-white/10"
          }`}
        >
          <span
            className={`text-lg font-black leading-none md:text-xl ${
              isCurrent ? "text-[#CFFF1A]" : "text-white"
            }`}
          >
            {event.monthLabel}
          </span>
          <span
            className="mt-2 text-xs font-bold tabular-nums leading-snug text-gray-400 md:text-sm"
          >
            {event.dateLabel}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-4 px-5 py-5 md:gap-6 md:px-8 md:py-6">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="text-lg font-black leading-snug tracking-tight text-white md:text-xl">
                {event.title}
              </h3>
              <StatusPill status={event.status} />
            </div>
            {event.subtitle ? (
              <p className="text-sm leading-relaxed text-gray-300">{event.subtitle}</p>
            ) : null}
          </div>

          <a
              href={event.signupUrl ?? EVENT_SIGNUP_IG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black transition-colors md:px-6 md:py-3 ${
                isCurrent
                  ? "bg-[#CFFF1A] text-[#0A0A0A] hover:opacity-90"
                  : "border border-white/15 text-gray-300 hover:border-[#CFFF1A]/40 hover:text-[#CFFF1A]"
              }`}
            >
              {event.signupLabel ?? "私訊報名"} <ChevronRight size={18} aria-hidden />
            </a>
        </div>
      </article>
    </motion.li>
  );
}

export default function EventsPage() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const cardVariants = shouldReduceMotion ? fadeInReduced : fadeInUp;
  const sorted = [...MONTHLY_EVENTS].sort((a, b) => a.monthNum - b.monthNum);
  const pastEvents = sorted.filter((e) => e.status === "past");
  const activeEvents = sorted.filter((e) => e.status !== "past");

  return (
    <div className="bg-[#0A0A0A] text-white">
      <section id="events" className="scroll-mt-28 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SitePageIntro
            eyebrow="EVENTS 2026"
            title="2026 活動一覽"
            description={`共 ${sorted.length} 場 · 每月一場會員活動`}
          />
          <div className="mb-10 flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-gray-500 md:mb-14">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#CFFF1A]" />
                報名中
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white/30" />
                即將
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gray-600" />
                已結束
              </span>
          </div>

          <div className="mx-auto max-w-4xl">
            {pastEvents.length > 0 ? (
              <div className="mb-8">
                <p className="mb-3 text-center text-xs font-bold tracking-wide text-gray-600">
                  已結束活動 · 點擊展開
                </p>
                <ul className="flex flex-col gap-2" role="list">
                  {pastEvents.map((event) => (
                    <PastEventRow key={event.monthNum} event={event} variants={cardVariants} />
                  ))}
                </ul>
              </div>
            ) : null}

            <ul className="flex flex-col gap-6" role="list">
              {activeEvents.map((event, i) => (
                <TimelineRow
                  key={event.monthNum}
                  event={event}
                  isFirst={i === 0}
                  isLast={i === activeEvents.length - 1}
                  variants={cardVariants}
                />
              ))}
            </ul>

            <p className="mt-10 text-center text-sm font-bold text-gray-500">
              報名請私訊 Instagram{" "}
              <a
                href={EVENT_SIGNUP_IG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-[#CFFF1A] hover:underline"
              >
                @sjsia_tw
              </a>
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
