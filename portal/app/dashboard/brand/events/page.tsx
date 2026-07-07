"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { EventItem } from "@/lib/types";
import { DashboardShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/DashboardShell";
import { BRAND_NAV, formatDateTime } from "@/lib/nav";

export default function BrandEventsPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [message, setMessage] = useState("");

  async function loadEvents() {
    const data = await api<{ events: EventItem[] }>("/api/events", { token });
    setEvents(data.events);
  }

  useEffect(() => {
    loadEvents().catch(() => setEvents([]));
  }, [token]);

  async function register(eventId: string, exposure: boolean) {
    setMessage("");
    try {
      await api(`/api/events/${eventId}/register`, {
        method: "POST",
        token,
        body: JSON.stringify({ exposure_requested: exposure }),
      });
      setMessage("報名成功");
      await loadEvents();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "報名失敗");
    }
  }

  async function cancelRegistration(eventId: string, title: string) {
    if (!confirm(`確定要取消「${title}」的報名嗎？`)) return;
    setMessage("");
    try {
      await api(`/api/events/${eventId}/register`, { method: "DELETE", token });
      setMessage("已取消報名");
      await loadEvents();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "取消報名失敗");
    }
  }

  return (
    <DashboardShell role="brand" title="品牌方 Dashboard" nav={BRAND_NAV}>
      <PageHeader title="每月協會活動" description="查看活動資訊，並可申請活動露出。" />
      {message ? <p className="mb-4 text-sm font-semibold text-[#CFFF1A]">{message}</p> : null}
      {events.length === 0 ? (
        <EmptyState message="目前尚無活動" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((ev) => (
            <Card key={ev.id}>
              <h3 className="text-lg font-black">{ev.title}</h3>
              <p className="mt-2 text-sm text-[#CFFF1A]">{formatDateTime(ev.event_date)}</p>
              {ev.location ? <p className="mt-1 text-sm text-gray-400">{ev.location}</p> : null}
              {ev.description ? (
                <p className="mt-3 text-sm leading-relaxed text-gray-300">{ev.description}</p>
              ) : null}
              {ev.registration_id ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Badge tone="success">
                    已報名{ev.exposure_requested ? "（含露出申請）" : ""}
                  </Badge>
                  <Button variant="secondary" onClick={() => cancelRegistration(ev.id, ev.title)}>
                    取消報名
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => register(ev.id, false)}>報名參加</Button>
                  {ev.allow_brand_exposure ? (
                    <Button variant="secondary" onClick={() => register(ev.id, true)}>
                      報名 + 申請露出
                    </Button>
                  ) : null}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
