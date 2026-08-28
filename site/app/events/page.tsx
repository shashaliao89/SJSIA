import type { Metadata } from "next";
import { EventsClient, type PublicEvent } from "./EventsClient";

const API_URL = process.env.SJSIA_API_URL ?? "https://sjsia-production.up.railway.app";

export const metadata: Metadata = {
  title: "活動公告",
  description: "查看盛家健康發展協會 SJSIA 最新運動活動、品牌交流、會員聚會與報名資訊。",
  alternates: { canonical: "/events" },
  openGraph: {
    title: "活動公告｜盛家健康發展協會",
    description: "每月運動交流、品牌合作與會員限定活動一覽。",
    url: "/events",
  },
};

async function getEvents(): Promise<PublicEvent[]> {
  try {
    const response = await fetch(`${API_URL}/api/events/public`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error(`Activity API returned ${response.status}`);
    const data = (await response.json()) as { events?: PublicEvent[] };
    return Array.isArray(data.events) ? data.events : [];
  } catch (error) {
    console.error("Unable to load public events:", error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();
  const eventJsonLd = events.map((event) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: event.event_date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: event.location
      ? { "@type": "Place", name: event.location }
      : undefined,
    organizer: {
      "@type": "Organization",
      name: "盛家健康發展協會",
      url: "https://sjsia.org",
    },
    url: event.signup_url ?? "https://sjsia.org/events",
  }));

  return (
    <>
      {eventJsonLd.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      ) : null}
      <EventsClient events={events} />
    </>
  );
}
