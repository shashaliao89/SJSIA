import { JWT } from "google-auth-library";
import { pool } from "../db/pool.js";

const ACTIVITY_SHEET = "活動管理";
const SYNC_INTERVAL_MS = 60_000;

let lastSyncAt = 0;
let activeSync: Promise<GoogleEventSyncResult> | null = null;

export const ACTIVITY_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1AsJZqXeo_6WOC7OmeAoetLbzQV4_zzwongKvu_135Yk/edit#gid=31082026";

export type GoogleEventSyncResult = {
  created: number;
  updated: number;
  unpublished: number;
  skipped: number;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function authClient() {
  return new JWT({
    email: requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: requiredEnv("GOOGLE_PRIVATE_KEY").replaceAll("\\n", "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function parseDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const normalized = raw.replace(
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/,
    "$1-$2-$3T$4:$5:00+08:00"
  );
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseBoolean(value: unknown) {
  return value === true || ["true", "yes", "是", "1", "開放"].includes(String(value ?? "").trim().toLowerCase());
}

export async function syncGoogleEvents(): Promise<GoogleEventSyncResult> {
  const spreadsheetId = requiredEnv("GOOGLE_SHEET_ID");
  const auth = authClient();
  const range = encodeURIComponent(`'${ACTIVITY_SHEET}'!A2:I500`);
  const response = await auth.request<{ values?: unknown[][] }>({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
  });

  const rows = response.data.values ?? [];
  const client = await pool.connect();
  const seenSourceRefs: string[] = [];
  const result: GoogleEventSyncResult = { created: 0, updated: 0, unpublished: 0, skipped: 0 };

  try {
    await client.query("BEGIN");
    for (const row of rows) {
      const eventKey = String(row[0] ?? "").trim();
      const title = String(row[1] ?? "").trim();
      const eventDate = parseDate(row[2]);
      if (!eventKey && !title) continue;
      if (!eventKey || !title || !eventDate) {
        result.skipped += 1;
        continue;
      }

      const sourceRef = `google-sheet:${spreadsheetId}:event:${eventKey}`;
      seenSourceRefs.push(sourceRef);
      const maxParticipantsRaw = Number(String(row[5] ?? "").replaceAll(",", ""));
      const registrationDeadline = parseDate(row[8]);
      const upsert = await client.query<{ inserted: boolean }>(
        `INSERT INTO events (
          title, event_date, location, description, max_participants,
          allow_brand_exposure, is_published, registration_deadline, source_ref
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (source_ref) WHERE source_ref IS NOT NULL DO UPDATE SET
          title=EXCLUDED.title, event_date=EXCLUDED.event_date, location=EXCLUDED.location,
          description=EXCLUDED.description, max_participants=EXCLUDED.max_participants,
          allow_brand_exposure=EXCLUDED.allow_brand_exposure,
          is_published=EXCLUDED.is_published,
          registration_deadline=EXCLUDED.registration_deadline, updated_at=NOW()
        RETURNING (xmax = 0) AS inserted`,
        [
          title,
          eventDate,
          String(row[3] ?? "").trim() || null,
          String(row[4] ?? "").trim() || null,
          Number.isFinite(maxParticipantsRaw) && maxParticipantsRaw > 0 ? Math.round(maxParticipantsRaw) : null,
          parseBoolean(row[6]),
          String(row[7] ?? "").trim() === "上架",
          registrationDeadline,
          sourceRef,
        ]
      );
      if (upsert.rows[0]?.inserted) result.created += 1;
      else result.updated += 1;
    }

    const missing = await client.query(
      `UPDATE events SET is_published=false, updated_at=NOW()
       WHERE source_ref LIKE $1
         AND NOT (source_ref = ANY($2::text[]))
         AND is_published=true`,
      [`google-sheet:${spreadsheetId}:event:%`, seenSourceRefs]
    );
    result.unpublished = missing.rowCount ?? 0;
    await client.query("COMMIT");
    lastSyncAt = Date.now();
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function syncGoogleEventsIfDue() {
  if (Date.now() - lastSyncAt < SYNC_INTERVAL_MS) return null;
  if (!activeSync) {
    activeSync = syncGoogleEvents().finally(() => {
      activeSync = null;
    });
  }
  return activeSync;
}
