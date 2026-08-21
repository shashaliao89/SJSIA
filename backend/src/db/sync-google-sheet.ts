import dotenv from "dotenv";
import { JWT } from "google-auth-library";
import { pool } from "./pool.js";

dotenv.config();

const SOURCE_SHEET = process.env.GOOGLE_FORM_RESPONSE_SHEET?.trim() || "表單回覆 1";
const PERSONAL_SHEET = process.env.GOOGLE_PERSONAL_MEMBER_SHEET?.trim() || "個人會員＿AI整理";
const ORGANIZATION_SHEET = process.env.GOOGLE_ORGANIZATION_MEMBER_SHEET?.trim() || "團體會員＿AI整理";

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
  const data = new Map<string, ExistingInstagramData>();
  for (const row of response.data.values ?? []) {
    const sourceRow = String(row[0] ?? "").trim();
    if (!sourceRow) continue;
    data.set(sourceRow, {
      displayName: String(row[4] ?? "").trim(),
      instagramUrl: String(row[6] ?? "").trim(),
      followerCount: String(row[8] ?? "").trim(),
      positioningTags: String(row[16] ?? "").trim(),
    });
  }
  return data;
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

  const syncedAt = new Date().toISOString();
  const personal: string[][] = [];
  const organizations: string[][] = [];

  rows.slice(1).forEach((row, index) => {
    const sourceRow = index + 2;
    const type = (row[1] ?? "").trim();
    const boardingStatus = (row[19] ?? "").trim();
    if (type.includes("個人會員")) {
      const submittedName = (row[7] ?? "").trim();
      const instagram = normalizeInstagramUrl(row[8] ?? "");
      if (!submittedName && !instagram) return;
      const followerRaw = (row[14] ?? "").trim();
      const existing = existingInstagramData.get(String(sourceRow));
      const canPreserveEnrichment = Boolean(instagram && existing?.instagramUrl === instagram.url);
      const displayName = canPreserveEnrichment && existing?.displayName
        ? existing.displayName
        : submittedName;
      const followerCount = canPreserveEnrichment && existing?.followerCount
        ? existing.followerCount
        : String(parseFollowerCount(followerRaw));
      personal.push([
        String(sourceRow), row[0] ?? "", type, submittedName, displayName,
        instagram?.handle ?? "", instagram?.url ?? "", followerRaw,
        followerCount, row[13] ?? "", row[10] ?? "", row[9] ?? "",
        boardingStatus, row[15] ?? "", instagram ? "連結已標準化；顯示名稱待 Meta API 驗證" : "Instagram 連結待補", syncedAt,
        canPreserveEnrichment ? existing?.positioningTags ?? "" : "",
      ]);
    } else if (type.includes("團體會員") || type.includes("企業團體會員")) {
      const brandName = (row[2] ?? "").trim();
      if (!brandName) return;
      organizations.push([
        String(sourceRow), row[0] ?? "", type, brandName, row[3] ?? "", "", row[5] ?? "", row[4] ?? "",
        boardingStatus, row[16] ?? "", syncedAt,
      ]);
    }
  });

  await replaceSheet(auth, spreadsheetId, PERSONAL_SHEET, [PERSONAL_HEADERS, ...personal]);
  await replaceSheet(auth, spreadsheetId, ORGANIZATION_SHEET, [ORGANIZATION_HEADERS, ...organizations]);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
          line_id=EXCLUDED.line_id, representative_name=EXCLUDED.representative_name,
          website_url=EXCLUDED.website_url, boarding_status=EXCLUDED.boarding_status,
          application_note=EXCLUDED.application_note, synced_at=NOW()`,
        [sourceRef, Number(row[0]), row[3], row[6] || null, row[7] || null, row[4] || null, row[5] || null, row[8] || null, row[9] || null]
      );
    }
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
