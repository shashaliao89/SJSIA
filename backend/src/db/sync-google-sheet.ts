import dotenv from "dotenv";
import { JWT } from "google-auth-library";
import { pool } from "./pool.js";
import {
  GOOGLE_FORM_RESPONSE_SHEET,
  GOOGLE_ORGANIZATION_MEMBER_SHEET,
  GOOGLE_PERSONAL_MEMBER_SHEET,
} from "../lib/google-sheet-names.js";

dotenv.config();

const SOURCE_SHEET = GOOGLE_FORM_RESPONSE_SHEET;
const PERSONAL_SHEET = GOOGLE_PERSONAL_MEMBER_SHEET;
const ORGANIZATION_SHEET = GOOGLE_ORGANIZATION_MEMBER_SHEET;

const PERSONAL_HEADERS = [
  "來源列", "時間戳記", "會員類型", "姓名", "IG 顯示名稱", "IG 帳號", "Instagram 連結",
  "粉絲數（原始）", "粉絲數", "合作報價", "Email", "Line ID", "登船狀態／方案",
  "主要訴求", "IG 資料狀態", "最後同步時間", "KOL 定位標籤",
];
const ORGANIZATION_HEADERS = [
  "來源列", "時間戳記", "會員類型", "品牌名稱", "代表人", "品牌連結", "Email", "Line ID",
  "登船狀態／方案", "主要訴求", "最後同步時間",
];

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function parseFollowerCount(raw: string) {
  const normalized = raw.trim().replaceAll(",", "").toLowerCase();
  if (!normalized) return 0;
  const match = normalized.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return 0;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return 0;
  if (normalized.includes("萬")) return Math.round(value * 10_000);
  if (normalized.includes("m")) return Math.round(value * 1_000_000);
  if (normalized.includes("k") || normalized.includes("千")) return Math.round(value * 1_000);
  return Math.round(value);
}

function normalizeInstagramUrl(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (!/^(www\.)?instagram\.com$/i.test(url.hostname)) return null;
    const handle = url.pathname.split("/").filter(Boolean)[0];
    if (!handle) return null;
    return { url: `https://www.instagram.com/${handle}/`, handle: `@${handle}` };
  } catch {
    return null;
  }
}

function findHeader(headers: string[], name: string, fallback: number) {
  const index = headers.indexOf(name);
  return index >= 0 ? index : fallback;
}

function findHeaderOccurrence(headers: string[], name: string, occurrence: number, fallback: number) {
  let found = 0;
  for (let index = 0; index < headers.length; index += 1) {
    if (headers[index] === name && ++found === occurrence) return index;
  }
  return fallback;
}

function findHeaderStartsWith(headers: string[], prefix: string, fallback: number) {
  const index = headers.findIndex((header) => header.startsWith(prefix));
  return index >= 0 ? index : fallback;
}

function authClient() {
  return new JWT({
    email: requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: requiredEnv("GOOGLE_PRIVATE_KEY").replaceAll("\\n", "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function readRows(auth: JWT, spreadsheetId: string) {
  const range = encodeURIComponent(`'${SOURCE_SHEET.replaceAll("'", "''")}'!A:X`);
  const response = await auth.request<{ values?: string[][] }>({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
  });
  return response.data.values ?? [];
}

type ExistingInstagramData = {
  instagramUrl: string;
  displayName: string;
  followerCount: string;
  positioningTags: string;
};

async function readExistingInstagramData(auth: JWT, spreadsheetId: string) {
  const escaped = PERSONAL_SHEET.replaceAll("'", "''");
  const range = encodeURIComponent(`'${escaped}'!A2:Q`);
  const response = await auth.request<{ values?: Array<Array<string | number>> }>({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
  });
  const bySourceRow = new Map<string, ExistingInstagramData>();
  const byInstagramUrl = new Map<string, ExistingInstagramData>();
  for (const row of response.data.values ?? []) {
    const sourceRow = String(row[0] ?? "").trim();
    if (!sourceRow) continue;
    const existing = {
      displayName: String(row[4] ?? "").trim(),
      instagramUrl: String(row[6] ?? "").trim(),
      followerCount: String(row[8] ?? "").trim(),
      positioningTags: String(row[16] ?? "").trim(),
    };
    bySourceRow.set(sourceRow, existing);
    if (existing.instagramUrl) byInstagramUrl.set(existing.instagramUrl, existing);
  }
  return { bySourceRow, byInstagramUrl };
}

async function replaceSheet(auth: JWT, spreadsheetId: string, sheetName: string, rows: string[][]) {
  const escaped = sheetName.replaceAll("'", "''");
  await auth.request({
    method: "POST",
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${escaped}'!A:Z`)}:clear`,
  });
  await auth.request({
    method: "PUT",
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${escaped}'!A1`)}?valueInputOption=USER_ENTERED`,
    data: { range: `'${escaped}'!A1`, majorDimension: "ROWS", values: rows },
  });
}

async function syncMembers() {
  const spreadsheetId = requiredEnv("GOOGLE_SHEET_ID");
  const auth = authClient();
  const rows = await readRows(auth, spreadsheetId);
  const existingInstagramData = await readExistingInstagramData(auth, spreadsheetId);
  if (rows.length < 2) throw new Error("Google Form response sheet returned no member rows");

  const headers = rows[0].map((value) => value.trim());
  const columns = {
    timestamp: findHeader(headers, "時間戳記", 0),
    type: findHeader(headers, "您欲申請的會員類別？", 1),
    brandName: findHeader(headers, "品牌名稱", 2),
    representative: findHeader(headers, "代表人 姓名", 3),
    organizationLine: findHeaderOccurrence(headers, "您的 Line ID", 1, 4),
    organizationEmail: findHeaderOccurrence(headers, "您的 Email （我們將會寄送入會收據給您）", 1, 5),
    personalName: findHeader(headers, "您的 姓名", 7),
    instagram: findHeader(headers, "您的 Instagram 帳號連結", 8),
    personalLine: findHeaderOccurrence(headers, "您的 Line ID", 2, 9),
    personalEmail: findHeaderOccurrence(headers, "您的 Email （我們將會寄送入會收據給您）", 2, 10),
    collaborationPrice: findHeaderStartsWith(headers, "為協助協會媒合合適的品牌合作機會", 13),
    followerCount: findHeader(headers, "您的 Instagram 粉絲人數", 14),
    personalRequest: findHeader(headers, "加入協會主要訴求/想對我們說的話", 15),
    organizationRequest: findHeader(headers, "是否有意願", 16),
    boardingStatus: 19,
  };

  const syncedAt = new Date().toISOString();
  const personal: string[][] = [];
  const organizations: string[][] = [];

  rows.slice(1).forEach((row, index) => {
    const sourceRow = index + 2;
    const type = (row[columns.type] ?? "").trim();
    const boardingStatus = (row[columns.boardingStatus] ?? "").trim();
    if (type.includes("個人會員")) {
      const submittedName = (row[columns.personalName] ?? "").trim();
      const instagram = normalizeInstagramUrl(row[columns.instagram] ?? "");
      if (!submittedName && !instagram) return;
      const followerRaw = (row[columns.followerCount] ?? "").trim();
      const existingAtRow = existingInstagramData.bySourceRow.get(String(sourceRow));
      const existing = instagram && existingAtRow?.instagramUrl === instagram.url
        ? existingAtRow
        : instagram ? existingInstagramData.byInstagramUrl.get(instagram.url) : undefined;
      const canPreserveEnrichment = Boolean(instagram && existing?.instagramUrl === instagram.url);
      const displayName = canPreserveEnrichment && existing?.displayName
        ? existing.displayName
        : submittedName;
      const followerCount = canPreserveEnrichment && existing?.followerCount
        ? existing.followerCount
        : String(parseFollowerCount(followerRaw));
      personal.push([
        String(sourceRow), row[columns.timestamp] ?? "", type, submittedName, displayName,
        instagram?.handle ?? "", instagram?.url ?? "", followerRaw,
        followerCount, row[columns.collaborationPrice] ?? "", row[columns.personalEmail] ?? "", row[columns.personalLine] ?? "",
        boardingStatus, row[columns.personalRequest] ?? "", instagram ? "連結已標準化；顯示名稱待 Meta API 驗證" : "Instagram 連結待補", syncedAt,
        canPreserveEnrichment ? existing?.positioningTags ?? "" : "",
      ]);
    } else if (type.includes("團體會員") || type.includes("企業團體會員")) {
      const brandName = (row[columns.brandName] ?? "").trim();
      if (!brandName) return;
      organizations.push([
        String(sourceRow), row[columns.timestamp] ?? "", type, brandName, row[columns.representative] ?? "", "",
        row[columns.organizationEmail] ?? "", row[columns.organizationLine] ?? "",
        boardingStatus, row[columns.organizationRequest] ?? "", syncedAt,
      ]);
    }
  });

  await replaceSheet(auth, spreadsheetId, PERSONAL_SHEET, [PERSONAL_HEADERS, ...personal]);
  await replaceSheet(auth, spreadsheetId, ORGANIZATION_SHEET, [ORGANIZATION_HEADERS, ...organizations]);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const personalSourceRefs = personal.map((row) => `google-form:${spreadsheetId}:row:${row[0]}`);
    const organizationSourceRefs = organizations.map((row) => `google-form:${spreadsheetId}:row:${row[0]}`);
    for (const row of personal) {
      const sourceRef = `google-form:${spreadsheetId}:row:${row[0]}`;
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
          row[4], row[6] || null, Number(row[8]), row[7] || null, row[9] || null,
          row[12] || null, sourceRef, row[14], row[16] ? row[16].split("、").filter(Boolean) : [],
        ]
      );
      await client.query(
        `INSERT INTO imported_members (source_ref, source_row, member_type, display_name, email, line_id,
          instagram_url, follower_count, collaboration_price, boarding_status, application_note, synced_at)
         VALUES ($1,$2,'kol',$3,$4,$5,$6,$7,$8,$9,$10,NOW())
         ON CONFLICT (source_ref) DO UPDATE SET display_name=EXCLUDED.display_name, email=EXCLUDED.email,
          member_type='kol', source_row=EXCLUDED.source_row,
          line_id=EXCLUDED.line_id, instagram_url=EXCLUDED.instagram_url, follower_count=EXCLUDED.follower_count,
          collaboration_price=EXCLUDED.collaboration_price, boarding_status=EXCLUDED.boarding_status,
          application_note=EXCLUDED.application_note, synced_at=NOW()`,
        [sourceRef, Number(row[0]), row[4], row[10] || null, row[11] || null, row[6] || null, Number(row[8]), row[9] || null, row[12] || null, row[13] || null]
      );
    }
    for (const row of organizations) {
      const sourceRef = `google-form:${spreadsheetId}:row:${row[0]}`;
      await client.query(
        `INSERT INTO imported_members (source_ref, source_row, member_type, display_name, email, line_id,
          representative_name, website_url, boarding_status, application_note, synced_at)
         VALUES ($1,$2,'brand',$3,$4,$5,$6,$7,$8,$9,NOW())
         ON CONFLICT (source_ref) DO UPDATE SET display_name=EXCLUDED.display_name, email=EXCLUDED.email,
          member_type='brand', source_row=EXCLUDED.source_row,
          line_id=EXCLUDED.line_id, representative_name=EXCLUDED.representative_name,
          website_url=EXCLUDED.website_url, boarding_status=EXCLUDED.boarding_status,
          application_note=EXCLUDED.application_note, synced_at=NOW()`,
        [sourceRef, Number(row[0]), row[3], row[6] || null, row[7] || null, row[4] || null, row[5] || null, row[8] || null, row[9] || null]
      );
    }
    const sourcePattern = `google-form:${spreadsheetId}:row:%`;
    await client.query(
      `DELETE FROM kol_profiles
       WHERE source_ref LIKE $1 AND NOT (source_ref = ANY($2::text[]))`,
      [sourcePattern, personalSourceRefs]
    );
    await client.query(
      `DELETE FROM imported_members
       WHERE source_ref LIKE $1
         AND NOT (source_ref = ANY($2::text[]) OR source_ref = ANY($3::text[]))`,
      [sourcePattern, personalSourceRefs, organizationSourceRefs]
    );
    await client.query("COMMIT");
    console.log(`Synced ${personal.length} personal and ${organizations.length} organization members from Google Form.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

syncMembers().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
