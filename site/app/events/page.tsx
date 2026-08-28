import { EventsClient, type PublicEvent } from "./EventsClient";

const API_URL = process.env.SJSIA_API_URL ?? "https://sjsia-production.up.railway.app";

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
  return <EventsClient events={await getEvents()} />;
}
