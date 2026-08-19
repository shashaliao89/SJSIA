import dotenv from "dotenv";
import { JWT } from "google-auth-library";
import { pool } from "./pool.js";

dotenv.config();

const REQUIRED_HEADERS = {
  memberType: "會員類型",
  name: "IG 顯示名稱",
  instagram: "Instagram／品牌連結",
  followers: "粉絲數（原始）",
  price: "合作報價",
  status: "登船狀態／方案",
} as const;

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
    return `https://www.instagram.com/${handle}/`;
  } catch {
    return null;
  }
}

function indexHeaders(headers: string[]) {
  const indexes = Object.fromEntries(
    Object.entries(REQUIRED_HEADERS).map(([key, header]) => [key, headers.indexOf(header)])
  ) as Record<keyof typeof REQUIRED_HEADERS, number>;
  const missing = Object.entries(indexes).filter(([, index]) => index < 0).map(([key]) => REQUIRED_HEADERS[key as keyof typeof REQUIRED_HEADERS]);
  if (missing.length) throw new Error(`Google Sheet missing headers: ${missing.join(", ")}`);
  return indexes;
}

async function readSheetRows() {
  const spreadsheetId = requiredEnv("GOOGLE_SHEET_ID");
  const sheetName = process.env.GOOGLE_SHEET_NAME?.trim() || "會員名單_整理";
  const auth = new JWT({
    email: requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: requiredEnv("GOOGLE_PRIVATE_KEY").replaceAll("\\n", "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const range = encodeURIComponent(`'${sheetName.replaceAll("'", "''")}'!A:P`);
  const response = await auth.request<{ values?: string[][] }>({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
  });
  return response.data.values ?? [];
}

async function syncMembers() {
  const rows = await readSheetRows();
  if (rows.length === 0) throw new Error("Google Sheet returned no rows");
  const [headers, ...dataRows] = rows;
  const columns = indexHeaders(headers);
  const records = dataRows.flatMap((row) => {
    if ((row[columns.memberType] ?? "").trim() !== "個人會員") return [];
    const name = (row[columns.name] ?? "").trim();
    const igUrl = normalizeInstagramUrl(row[columns.instagram] ?? "");
    if (!name || !igUrl) return [];
    const followerRaw = (row[columns.followers] ?? "").trim();
    return [{
      sourceRef: `google-sheet:${igUrl.toLowerCase()}`,
      name,
      igUrl,
      followerRaw: followerRaw || null,
      followerCount: parseFollowerCount(followerRaw),
      collaborationPrice: (row[columns.price] ?? "").trim() || null,
      boardingStatus: (row[columns.status] ?? "").trim() || null,
    }];
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const record of records) {
      await client.query(
        `INSERT INTO kol_profiles (
          name, ig_url, follower_count, follower_count_raw,
          collaboration_price, boarding_status, source_ref,
          open_to_contact, is_public
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,true,true)
        ON CONFLICT (source_ref) WHERE source_ref IS NOT NULL DO UPDATE SET
          name = EXCLUDED.name,
          ig_url = EXCLUDED.ig_url,
          follower_count = EXCLUDED.follower_count,
          follower_count_raw = EXCLUDED.follower_count_raw,
          collaboration_price = EXCLUDED.collaboration_price,
          boarding_status = EXCLUDED.boarding_status,
          updated_at = NOW()`,
        [record.name, record.igUrl, record.followerCount, record.followerRaw, record.collaborationPrice, record.boardingStatus, record.sourceRef]
      );
    }
    await client.query("COMMIT");
    console.log(`Synced ${records.length} KOL profiles from Google Sheets.`);
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
