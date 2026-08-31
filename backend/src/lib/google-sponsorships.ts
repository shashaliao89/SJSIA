import { JWT } from "google-auth-library";
import { pool } from "../db/pool.js";

const SPONSORSHIP_SHEET = "曝光／贊助機會";
const SYNC_INTERVAL_MS = 60_000;

let lastSyncAt = 0;
let activeSync: Promise<GoogleSponsorshipSyncResult> | null = null;

export type GoogleSponsorshipSyncResult = {
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
  const match = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!match) return null;
  const normalized = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  const date = new Date(`${normalized}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : normalized;
}

export async function syncGoogleSponsorships(): Promise<GoogleSponsorshipSyncResult> {
  const spreadsheetId = requiredEnv("GOOGLE_SHEET_ID");
  const auth = authClient();
  const range = encodeURIComponent(`'${SPONSORSHIP_SHEET}'!A2:F500`);
  const response = await auth.request<{ values?: unknown[][] }>({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
  });
  const rows = response.data.values ?? [];
  const client = await pool.connect();
  const seenSlugs: string[] = [];
  const result: GoogleSponsorshipSyncResult = { created: 0, updated: 0, unpublished: 0, skipped: 0 };

  try {
    await client.query("BEGIN");
    for (const row of rows) {
      const title = String(row[0] ?? "").trim();
      const startDate = parseDate(row[1]);
      const endDate = parseDate(row[2]);
      const deckUrl = String(row[3] ?? "").trim();
      const isPublished = String(row[4] ?? "").trim() === "上架";
      const slug = String(row[5] ?? "").trim();
      if (!title && !slug) continue;
      if (!title || !startDate || !endDate || !deckUrl.startsWith("https://") || !slug) {
        result.skipped += 1;
        continue;
      }
      seenSlugs.push(slug);
      const upsert = await client.query<{ inserted: boolean }>(
        `INSERT INTO sponsorship_opportunities (slug, title, start_date, end_date, deck_url, is_published)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, start_date=EXCLUDED.start_date,
           end_date=EXCLUDED.end_date, deck_url=EXCLUDED.deck_url,
           is_published=EXCLUDED.is_published, updated_at=NOW()
         RETURNING (xmax = 0) AS inserted`,
        [slug, title, startDate, endDate, deckUrl, isPublished]
      );
      if (upsert.rows[0]?.inserted) result.created += 1;
      else result.updated += 1;
    }

    const missing = await client.query(
      `UPDATE sponsorship_opportunities SET is_published=false, updated_at=NOW()
       WHERE NOT (slug = ANY($1::text[])) AND is_published=true`,
      [seenSlugs]
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

export async function syncGoogleSponsorshipsIfDue() {
  if (Date.now() - lastSyncAt < SYNC_INTERVAL_MS) return null;
  if (!activeSync) {
    activeSync = syncGoogleSponsorships().finally(() => {
      activeSync = null;
    });
  }
  return activeSync;
}
