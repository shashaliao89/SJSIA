import { JWT } from "google-auth-library";
import { pool } from "./pool.js";
import {
  GOOGLE_ORGANIZATION_MEMBER_SHEET,
  GOOGLE_PERSONAL_MEMBER_SHEET,
  googleFormSourceRef,
} from "../lib/google-sheet-names.js";

type SheetRow = Array<string | number>;

let lastSyncAt = 0;
let activeSync: Promise<MemberSyncResult> | null = null;

export type MemberSyncResult = {
  personal: number;
  organizations: number;
  syncedAt: string;
};

function requiredConfig(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function authClient() {
  return new JWT({
    email: requiredConfig("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: requiredConfig("GOOGLE_PRIVATE_KEY").replaceAll("\\n", "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

async function readSheet(auth: JWT, spreadsheetId: string, sheetName: string) {
  const escaped = sheetName.replaceAll("'", "''");
  const range = encodeURIComponent(`'${escaped}'!A:Z`);
  const response = await auth.request<{ values?: SheetRow[] }>({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
  });
  return response.data.values ?? [];
}

function records(rows: SheetRow[]) {
  const headers = (rows[0] ?? []).map((value) => String(value).trim());
  return rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "").trim()]))
  );
}

function parseCount(value: string) {
  const count = Number(value.replaceAll(",", ""));
  return Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
}

function splitTags(value: string) {
  return value.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 5);
}

export async function syncOrganizedMembers(): Promise<MemberSyncResult> {
  const spreadsheetId = requiredConfig("GOOGLE_SHEET_ID");
  const auth = authClient();
  const [personalRows, organizationRows] = await Promise.all([
    readSheet(auth, spreadsheetId, GOOGLE_PERSONAL_MEMBER_SHEET),
    readSheet(auth, spreadsheetId, GOOGLE_ORGANIZATION_MEMBER_SHEET),
  ]);
  const personal = records(personalRows).filter((row) => row["時間戳記"] && row["IG 顯示名稱"]);
  const organizations = records(organizationRows).filter((row) => row["時間戳記"] && row["品牌名稱"]);
  const personalRefs = personal.map((row) => googleFormSourceRef(spreadsheetId, row["時間戳記"]));
  const organizationRefs = organizations.map((row) => googleFormSourceRef(spreadsheetId, row["時間戳記"]));
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (const row of personal) {
      const sourceRef = googleFormSourceRef(spreadsheetId, row["時間戳記"]);
      const followerCount = parseCount(row["粉絲數"]);
      const tags = splitTags(row["KOL 定位標籤"]);
      await client.query(
        `INSERT INTO kol_profiles (
          name, ig_url, follower_count, follower_count_raw, collaboration_price,
          boarding_status, source_ref, data_check, content_types, open_to_contact, is_public
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,true)
        ON CONFLICT (source_ref) WHERE source_ref IS NOT NULL DO UPDATE SET
          name=EXCLUDED.name, ig_url=EXCLUDED.ig_url, follower_count=EXCLUDED.follower_count,
          follower_count_raw=EXCLUDED.follower_count_raw, collaboration_price=EXCLUDED.collaboration_price,
          boarding_status=EXCLUDED.boarding_status, data_check=EXCLUDED.data_check,
          content_types=EXCLUDED.content_types, updated_at=NOW()`,
        [
          row["IG 顯示名稱"], row["Instagram 連結"] || null, followerCount,
          row["粉絲數（原始）"] || null, row["合作報價"] || null,
          row["登船狀態／方案"] || null, sourceRef, row["IG 資料狀態"] || null, tags,
        ]
      );
      await client.query(
        `INSERT INTO imported_members (source_ref, source_row, member_type, display_name, email, line_id,
          instagram_url, follower_count, collaboration_price, boarding_status, application_note, synced_at)
         VALUES ($1,$2,'kol',$3,$4,$5,$6,$7,$8,$9,$10,NOW())
         ON CONFLICT (source_ref) DO UPDATE SET source_row=EXCLUDED.source_row, member_type='kol',
          display_name=EXCLUDED.display_name, email=EXCLUDED.email, line_id=EXCLUDED.line_id,
          instagram_url=EXCLUDED.instagram_url, follower_count=EXCLUDED.follower_count,
          collaboration_price=EXCLUDED.collaboration_price, boarding_status=EXCLUDED.boarding_status,
          application_note=EXCLUDED.application_note, synced_at=NOW()`,
        [sourceRef, Number(row["來源列"]) || null, row["IG 顯示名稱"], row.Email || null,
          row["Line ID"] || null, row["Instagram 連結"] || null, followerCount,
          row["合作報價"] || null, row["登船狀態／方案"] || null, row["主要訴求"] || null]
      );
    }

    for (const row of organizations) {
      const sourceRef = googleFormSourceRef(spreadsheetId, row["時間戳記"]);
      await client.query(
        `INSERT INTO imported_members (source_ref, source_row, member_type, display_name, email, line_id,
          representative_name, website_url, boarding_status, application_note, synced_at)
         VALUES ($1,$2,'brand',$3,$4,$5,$6,$7,$8,$9,NOW())
         ON CONFLICT (source_ref) DO UPDATE SET source_row=EXCLUDED.source_row, member_type='brand',
          display_name=EXCLUDED.display_name, email=EXCLUDED.email, line_id=EXCLUDED.line_id,
          representative_name=EXCLUDED.representative_name, website_url=EXCLUDED.website_url,
          boarding_status=EXCLUDED.boarding_status, application_note=EXCLUDED.application_note, synced_at=NOW()`,
        [sourceRef, Number(row["來源列"]) || null, row["品牌名稱"], row.Email || null,
          row["Line ID"] || null, row["代表人"] || null, row["品牌連結"] || null,
          row["登船狀態／方案"] || null, row["主要訴求"] || null]
      );
    }

    const sourcePattern = `google-form:${spreadsheetId}:%`;
    await client.query(
      `DELETE FROM kol_profiles WHERE source_ref LIKE $1 AND NOT (source_ref = ANY($2::text[]))`,
      [sourcePattern, personalRefs]
    );
    await client.query(
      `DELETE FROM imported_members WHERE source_ref LIKE $1
       AND NOT (source_ref = ANY($2::text[]) OR source_ref = ANY($3::text[]))`,
      [sourcePattern, personalRefs, organizationRefs]
    );
    await client.query("COMMIT");
    return { personal: personal.length, organizations: organizations.length, syncedAt: new Date().toISOString() };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function syncOrganizedMembersIfDue(maxAgeMs = 60_000) {
  if (activeSync) return activeSync;
  if (Date.now() - lastSyncAt < maxAgeMs) return Promise.resolve(null);
  activeSync = syncOrganizedMembers()
    .then((result) => {
      lastSyncAt = Date.now();
      return result;
    })
    .finally(() => {
      activeSync = null;
    });
  return activeSync;
}
