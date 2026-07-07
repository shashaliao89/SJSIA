"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, STATUS_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { EventItem, EventRegistration } from "@/lib/types";
import {
  DashboardShell,
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
} from "@/components/DashboardShell";
import { ADMIN_NAV, formatDateTime, toDatetimeLocalValue } from "@/lib/nav";

function parseEventForm(fd: FormData) {
  return {
    title: String(fd.get("title") ?? ""),
    description: String(fd.get("description") ?? "") || null,
    event_date: String(fd.get("event_date") ?? ""),
    location: String(fd.get("location") ?? "") || null,
    max_participants: fd.get("max_participants") ? Number(fd.get("max_participants")) : null,
    allow_brand_exposure: fd.get("allow_brand_exposure") === "on",
  };
}

function EventForm({
  editing,
  onSubmit,
  onCancel,
}: {
  editing: EventItem | null;
  onSubmit: (payload: ReturnType<typeof parseEventForm>) => Promise<void>;
  onCancel: () => void;
}) {
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = parseEventForm(new FormData(form));
    try {
      await onSubmit(payload);
      if (!editing) form.reset();
    } catch {
      // parent handles errors
    }
  }

  return (
    <Card className="mb-8">
      <h3 className="mb-4 font-black">{editing ? "編輯活動" : "新增活動"}</h3>
      <form key={editing?.id ?? "new"} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title">活動名稱</label>
          <input id="title" name="title" required defaultValue={editing?.title ?? ""} />
        </div>
        <div>
          <label htmlFor="description">活動說明</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={editing?.description ?? ""}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="event_date">活動時間</label>
            <input
              id="event_date"
              name="event_date"
              type="datetime-local"
              required
              defaultValue={editing ? toDatetimeLocalValue(editing.event_date) : ""}
            />
          </div>
          <div>
            <label htmlFor="location">地點</label>
            <input id="location" name="location" defaultValue={editing?.location ?? ""} />
          </div>
        </div>
        <div>
          <label htmlFor="max_participants">人數上限</label>
          <input
            id="max_participants"
            name="max_participants"
            type="number"
            min={1}
            defaultValue={editing?.max_participants ?? ""}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            name="allow_brand_exposure"
            className="w-auto"
            defaultChecked={editing?.allow_brand_exposure ?? false}
          />
          開放品牌露出申請
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{editing ? "儲存變更" : "建立活動"}</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            取消
          </Button>
        </div>
      </form>
    </Card>
  );
}

function RegistrationList({ registrations }: { registrations: EventRegistration[] }) {
  if (registrations.length === 0) {
    return <p className="text-sm text-gray-400">尚無報名</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-gray-400">
            <th className="pb-2 pr-4 font-semibold">報名者</th>
            <th className="pb-2 pr-4 font-semibold">Email</th>
            <th className="pb-2 pr-4 font-semibold">角色</th>
            <th className="pb-2 pr-4 font-semibold">品牌露出</th>
            <th className="pb-2 pr-4 font-semibold">狀態</th>
            <th className="pb-2 font-semibold">報名時間</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((r) => {
            const displayName =
              r.brand_name ?? r.kol_name ?? r.registrant_name ?? r.email ?? "—";
            const roleLabel =
              r.role === "brand" ? "品牌" : r.role === "kol" ? "KOL" : r.is_member ? "會員" : "—";

            return (
              <tr key={r.id} className="border-b border-white/5 text-gray-300">
                <td className="py-3 pr-4 font-medium text-white">{displayName}</td>
                <td className="py-3 pr-4">{r.email ?? r.registrant_email ?? "—"}</td>
                <td className="py-3 pr-4">{roleLabel}</td>
                <td className="py-3 pr-4">
                  {r.exposure_requested ? (
                    <Badge tone="warning">申請露出</Badge>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={r.attended ? "success" : "default"}>
                    {r.attended ? "已出席" : STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                </td>
                <td className="py-3 text-gray-400">{formatDateTime(r.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminEventsPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [message, setMessage] = useState("");
  const [viewRegistrationsFor, setViewRegistrationsFor] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  async function load() {
    const data = await api<{ events: EventItem[] }>("/api/events", { token });
    setEvents(data.events);
  }

  useEffect(() => {
    load().catch(() => setEvents([]));
  }, [token]);

  async function handleCreate(payload: ReturnType<typeof parseEventForm>) {
    setMessage("");
    try {
      await api("/api/events", { method: "POST", token, body: JSON.stringify(payload) });
      setShowCreateForm(false);
      setMessage("活動已建立");
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "新增失敗");
      throw err;
    }
  }

  async function handleEdit(payload: ReturnType<typeof parseEventForm>) {
    if (!editing) return;
    setMessage("");
    try {
      await api(`/api/events/${editing.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify(payload),
      });
      setEditing(null);
      setMessage("活動已更新");
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "更新失敗");
      throw err;
    }
  }

  async function removeEvent(id: string, title: string) {
    if (!confirm(`確定要移除「${title}」嗎？相關報名紀錄也會一併刪除。`)) return;
    setMessage("");
    try {
      await api(`/api/events/${id}`, { method: "DELETE", token });
      if (viewRegistrationsFor === id) {
        setViewRegistrationsFor(null);
        setRegistrations([]);
      }
      if (editing?.id === id) setEditing(null);
      setMessage("活動已移除");
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "移除失敗");
    }
  }

  async function toggleRegistrations(eventId: string) {
    if (viewRegistrationsFor === eventId) {
      setViewRegistrationsFor(null);
      setRegistrations([]);
      return;
    }

    setViewRegistrationsFor(eventId);
    setLoadingRegistrations(true);
    setRegistrations([]);
    try {
      const data = await api<{ registrations: EventRegistration[] }>(
        `/api/events/${eventId}/registrations`,
        { token }
      );
      setRegistrations(data.registrations);
    } catch (err) {
      setViewRegistrationsFor(null);
      alert(err instanceof ApiError ? err.message : "無法載入報名清單");
    } finally {
      setLoadingRegistrations(false);
    }
  }

  function openCreateForm() {
    setEditing(null);
    setShowCreateForm((v) => !v);
  }

  function openEditForm(ev: EventItem) {
    setShowCreateForm(false);
    setEditing(ev);
    setViewRegistrationsFor(null);
    setRegistrations([]);
  }

  function closeForms() {
    setShowCreateForm(false);
    setEditing(null);
  }

  return (
    <DashboardShell role="admin" title="Admin Dashboard" nav={ADMIN_NAV}>
      <PageHeader title="活動管理" description="新增、編輯協會活動，並查看報名清單。" />
      {message ? <p className="mb-4 text-sm font-semibold text-[#CFFF1A]">{message}</p> : null}

      <div className="mb-6">
        <Button onClick={openCreateForm}>{showCreateForm ? "取消新增" : "+ 新增活動"}</Button>
      </div>

      {showCreateForm ? (
        <EventForm editing={null} onSubmit={handleCreate} onCancel={closeForms} />
      ) : null}

      {editing ? (
        <EventForm editing={editing} onSubmit={handleEdit} onCancel={() => setEditing(null)} />
      ) : null}

      {events.length === 0 ? (
        <EmptyState message="尚無活動" />
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <Card key={ev.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-black">{ev.title}</h3>
                  <p className="mt-1 text-sm text-[#CFFF1A]">{formatDateTime(ev.event_date)}</p>
                  {ev.location ? <p className="text-sm text-gray-400">{ev.location}</p> : null}
                  {ev.max_participants ? (
                    <p className="mt-1 text-xs text-gray-500">人數上限：{ev.max_participants}</p>
                  ) : null}
                  {ev.allow_brand_exposure ? (
                    <Badge tone="warning" className="mt-2">
                      開放品牌露出
                    </Badge>
                  ) : null}
                  {ev.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-gray-300">{ev.description}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => openEditForm(ev)}>
                    編輯
                  </Button>
                  <Button variant="secondary" onClick={() => toggleRegistrations(ev.id)}>
                    {viewRegistrationsFor === ev.id ? "收起報名" : "查看報名"}
                  </Button>
                  <Button variant="danger" onClick={() => removeEvent(ev.id, ev.title)}>
                    移除
                  </Button>
                </div>
              </div>

              {viewRegistrationsFor === ev.id ? (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-sm font-bold text-white">報名清單</p>
                  {loadingRegistrations ? (
                    <p className="mt-2 text-sm text-gray-400">載入中…</p>
                  ) : (
                    <RegistrationList registrations={registrations} />
                  )}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
