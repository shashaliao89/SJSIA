"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronRight, ChevronUp, MapPin } from "lucide-react";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { SitePageIntro } from "@/app/_components/SitePageIntro";
import { IG_OFFICIAL_URL } from "@/lib/contact";

type EventStatus = "past" | "current" | "upcoming";

export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  max_participants: number | null;
  registration_deadline: string | null;
  signup_url: string | null;
}

type DisplayEvent = PublicEvent & {
  monthLabel: string;
  dateLabel: string;
  status: EventStatus;
};

const STATUS_LABEL: Record<EventStatus, string> = {
  past: "已結束",
  current: "開放報名",
  upcoming: "即將舉辦",
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const fadeInReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

function toDisplayEvent(event: PublicEvent): DisplayEvent {
  const date = new Date(event.event_date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const deadlineOpen = !event.registration_deadline || new Date(event.registration_deadline) >= now;
  const status: EventStatus = eventDay < today
    ? "past"
    : event.signup_url && deadlineOpen
      ? "current"
      : "upcoming";

  return {
    ...event,
    status,
    monthLabel: `${date.getMonth() + 1} 月`,
    dateLabel: new Intl.DateTimeFormat("zh-TW", {
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Taipei",
    }).format(date),
  };
}

function StatusPill({ status }: { status: EventStatus }) {
  const styles = {
    past: "border-white/10 bg-white/[0.04] text-gray-500",
    current: "border-[#CFFF1A]/40 bg-[#CFFF1A]/15 text-[#CFFF1A]",
    upcoming: "border-white/15 bg-white/[0.06] text-gray-300",
  };
  return (
    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${styles[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function PastEventRow({ event, variants }: { event: DisplayEvent; variants: typeof fadeInUp | typeof fadeInReduced }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.li initial="hidden" whileInView="visible" viewport={{ once: true }} variants={variants}>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] opacity-80">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.05] md:px-5"
        >
          <span className="shrink-0 text-xs font-black text-gray-500 md:text-sm">{event.monthLabel}</span>
          <span className="shrink-0 text-xs font-bold tabular-nums text-gray-600">{event.dateLabel}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-400">{event.title}</span>
          <StatusPill status="past" />
          {expanded ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
        </button>
        {expanded ? (
          <div className="space-y-2 border-t border-white/10 px-4 py-4 text-sm text-gray-500 md:px-5">
            {event.location ? <p className="flex items-center gap-2"><MapPin size={15} aria-hidden />{event.location}</p> : null}
            {event.description ? <p className="leading-relaxed">{event.description}</p> : <p>活動已結束，感謝參與。</p>}
          </div>
        ) : null}
      </div>
    </motion.li>
  );
}

function TimelineRow({ event, variants }: { event: DisplayEvent; variants: typeof fadeInUp | typeof fadeInReduced }) {
  const isCurrent = event.status === "current";
  return (
    <motion.li initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-8%" }} variants={variants}>
      <article className={`flex min-w-0 flex-col overflow-hidden rounded-3xl border backdrop-blur-md sm:flex-row ${isCurrent ? "border-[#CFFF1A]/40 bg-[#CFFF1A]/10" : "border-white/10 bg-white/5"}`}>
        <div className={`flex shrink-0 items-center gap-3 border-b px-5 py-4 sm:w-[7rem] sm:flex-col sm:justify-center sm:border-b-0 sm:border-r ${isCurrent ? "border-[#CFFF1A]/20" : "border-white/10"}`}>
          <span className={`text-lg font-black ${isCurrent ? "text-[#CFFF1A]" : "text-white"}`}>{event.monthLabel}</span>
          <span className="text-xs font-bold tabular-nums text-gray-400">{event.dateLabel}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center md:px-8 md:py-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-black leading-snug text-white md:text-xl">{event.title}</h3>
              <StatusPill status={event.status} />
            </div>
            {event.location ? <p className="flex items-center gap-2 text-sm text-gray-300"><MapPin size={15} aria-hidden />{event.location}</p> : null}
            {event.description ? <p className="line-clamp-2 text-sm leading-relaxed text-gray-400">{event.description}</p> : null}
          </div>
          <a
            href={event.signup_url ?? IG_OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black ${isCurrent ? "bg-[#CFFF1A] text-[#0A0A0A]" : "border border-white/15 text-gray-300 hover:text-[#CFFF1A]"}`}
          >
            {isCurrent ? "立即報名" : "查看活動"} <ChevronRight size={18} aria-hidden />
          </a>
        </div>
      </article>
    </motion.li>
  );
}

export function EventsClient({ events }: { events: PublicEvent[] }) {
  const variants = useReducedMotion() ? fadeInReduced : fadeInUp;
  const sorted = events
    .map(toDisplayEvent)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  const pastEvents = sorted.filter((event) => event.status === "past");
  const activeEvents = sorted.filter((event) => event.status !== "past").reverse();

  return (
    <div className="max-w-full overflow-x-clip bg-[#0A0A0A] text-white">
      <section id="events" className="scroll-mt-28 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SitePageIntro eyebrow="EVENTS" title="協會活動一覽" description={`目前共 ${sorted.length} 場已上架活動`} />
          <div className="mx-auto max-w-4xl">
            {activeEvents.length ? (
              <ul className="mb-10 flex flex-col gap-6" role="list">
                {activeEvents.map((event) => <TimelineRow key={event.id} event={event} variants={variants} />)}
              </ul>
            ) : (
              <div className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                <CalendarDays className="mx-auto mb-4 text-[#CFFF1A]" aria-hidden />
                <h2 className="text-xl font-black">新活動籌備中</h2>
                <p className="mt-2 text-sm text-gray-400">最新活動將由協會管理後台上架，歡迎追蹤 Instagram。</p>
              </div>
            )}
            {pastEvents.length ? (
              <div>
                <p className="mb-3 text-center text-xs font-bold tracking-wide text-gray-600">歷史活動 · 點擊展開</p>
                <ul className="flex flex-col gap-2" role="list">
                  {pastEvents.map((event) => <PastEventRow key={event.id} event={event} variants={variants} />)}
                </ul>
              </div>
            ) : null}
            <p className="mt-10 text-center text-sm font-bold text-gray-500">
              活動相關問題請私訊 <a href={IG_OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="font-black text-[#CFFF1A] hover:underline">@sjsia_tw</a>
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
