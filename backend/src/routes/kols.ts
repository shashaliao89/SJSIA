import { Router } from "express";
import { z } from "zod";
import { JWT } from "google-auth-library";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole, requireApproved } from "../middleware/auth.js";
import { GOOGLE_PERSONAL_MEMBER_SHEET, googleFormSourceRef } from "../lib/google-sheet-names.js";
import { syncOrganizedMembersIfDue } from "../db/sync-organized-members.js";

const router = Router();

async function loadPositioningTagsFromSheet() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const sheetName = GOOGLE_PERSONAL_MEMBER_SHEET;
  if (!spreadsheetId || !email || !key) return null;

  const auth = new JWT({
    email,
    key: key.replaceAll("\\n", "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const escaped = sheetName.replaceAll("'", "''");
  const range = encodeURIComponent(`'${escaped}'!A2:Q`);
  const response = await auth.request<{ values?: Array<Array<string | number>> }>({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
  });
  const tagsBySourceRef = new Map<string, string[]>();
  for (const row of response.data.values ?? []) {
    const timestamp = String(row[1] ?? "").trim();
    const tags = String(row[16] ?? "")
      .split("、")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5);
    if (timestamp && tags.length) tagsBySourceRef.set(googleFormSourceRef(spreadsheetId, timestamp), tags);
  }
  return tagsBySourceRef;
}

const kolSchema = z.object({
  name: z.string().min(1),
  ig_url: z.string().optional().nullable(),
  youtube_url: z.string().optional().nullable(),
  tiktok_url: z.string().optional().nullable(),
  follower_count: z.number().int().optional(),
  follower_count_raw: z.string().optional().nullable(),
  audience_profile: z.string().optional().nullable(),
  content_types: z.array(z.string()).optional(),
  collaboration_types: z.array(z.string()).optional(),
  collaboration_price: z.string().optional().nullable(),
  boarding_status: z.string().optional().nullable(),
  membership_tag: z.string().optional().nullable(),
  data_check: z.string().optional().nullable(),
  past_cases: z.string().optional().nullable(),
  open_to_contact: z.boolean().optional(),
  is_public: z.boolean().optional(),
  user_id: z.string().uuid().optional().nullable(),
});

router.get("/", requireAuth, requireApproved, async (req, res) => {
  try {
    await syncOrganizedMembersIfDue();
  } catch (error) {
    console.error("Failed to sync organized member sheets:", error);
  }
  if (req.user!.role === "admin") {
    const result = await pool.query(
      `SELECT *,
        CASE
          WHEN follower_count < 10000 THEN 'under_10k'
          WHEN follower_count < 100000 THEN '10k_to_100k'
          ELSE 'over_100k'
        END AS follower_tier
       FROM kol_profiles
       ORDER BY follower_count DESC NULLS LAST, name ASC`
    );
    try {
      const tagsBySourceRef = await loadPositioningTagsFromSheet();
      if (tagsBySourceRef) {
        for (const kol of result.rows) {
          const sourceRef = String(kol.source_ref ?? "");
          if (tagsBySourceRef.has(sourceRef)) {
            kol.content_types = tagsBySourceRef.get(sourceRef);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load live KOL positioning tags:", error);
    }
    return res.json({ kols: result.rows });
  }
  if (req.user!.role === "brand") {
    const result = await pool.query(
      `SELECT kp.id, kp.name, kp.ig_url, kp.youtube_url, kp.tiktok_url, kp.follower_count,
        audience_profile, content_types, collaboration_types, past_cases,
        open_to_contact, is_public, avatar_url, gender,
        (c.id IS NOT NULL) AS contacted, c.id AS conversation_id,
        CASE
          WHEN follower_count < 10000 THEN 'under_10k'
          WHEN follower_count < 100000 THEN '10k_to_100k'
          ELSE 'over_100k'
        END AS follower_tier
       FROM kol_profiles kp
       LEFT JOIN conversations c ON c.brand_user_id=$1 AND c.target_kol_id=kp.id
         AND c.conversation_type='kol_contact'
       WHERE kp.is_public = true AND kp.ig_url ~* '^https?://'
       ORDER BY kp.follower_count DESC NULLS LAST, kp.name ASC`,
      [req.user!.id]
    );
    return res.json({ kols: result.rows });
  }
  return res.status(403).json({ error: "權限不足" });
});

router.get("/profile", requireAuth, requireRole("kol"), async (req, res) => {
  const result = await pool.query(`SELECT * FROM kol_profiles WHERE user_id = $1`, [req.user!.id]);
  res.json({ profile: result.rows[0] ?? null });
});

router.put("/profile", requireAuth, requireRole("kol"), async (req, res) => {
  const parsed = kolSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const d = parsed.data;
  const result = await pool.query(
    `UPDATE kol_profiles SET
      name = COALESCE($2, name),
      ig_url = $3, youtube_url = $4, tiktok_url = $5,
      follower_count = COALESCE($6, follower_count),
      audience_profile = $7,
      content_types = COALESCE($8, content_types),
      collaboration_types = COALESCE($9, collaboration_types),
      collaboration_price = $10,
      past_cases = $11,
      open_to_contact = COALESCE($12, open_to_contact),
      is_public = COALESCE($13, is_public),
      updated_at = NOW()
     WHERE user_id = $1 RETURNING *`,
    [
      req.user!.id,
      d.name,
      d.ig_url ?? null,
      d.youtube_url ?? null,
      d.tiktok_url ?? null,
      d.follower_count,
      d.audience_profile ?? null,
      d.content_types,
      d.collaboration_types,
      d.collaboration_price ?? null,
      d.past_cases ?? null,
      d.open_to_contact,
      d.is_public,
    ]
  );
  res.json({ profile: result.rows[0] });
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = kolSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const d = parsed.data;
  const result = await pool.query(
    `INSERT INTO kol_profiles (
      user_id, name, ig_url, youtube_url, tiktok_url, follower_count,
      audience_profile, content_types, collaboration_types, collaboration_price,
      past_cases, open_to_contact, is_public, follower_count_raw,
      boarding_status, membership_tag, data_check
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    [
      d.user_id ?? null,
      d.name,
      d.ig_url ?? null,
      d.youtube_url ?? null,
      d.tiktok_url ?? null,
      d.follower_count ?? 0,
      d.audience_profile ?? null,
      d.content_types ?? [],
      d.collaboration_types ?? [],
      d.collaboration_price ?? null,
      d.past_cases ?? null,
      d.open_to_contact ?? true,
      d.is_public ?? true,
      d.follower_count_raw ?? null,
      d.boarding_status ?? null,
      d.membership_tag ?? null,
      d.data_check ?? null,
    ]
  );
  res.status(201).json({ kol: result.rows[0] });
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = kolSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const d = parsed.data;
  const result = await pool.query(
    `UPDATE kol_profiles SET
      name = $2, ig_url = $3, youtube_url = $4, tiktok_url = $5,
      follower_count = COALESCE($6, follower_count),
      audience_profile = $7,
      content_types = COALESCE($8, content_types),
      collaboration_types = COALESCE($9, collaboration_types),
      collaboration_price = $10,
      past_cases = $11,
      open_to_contact = COALESCE($12, open_to_contact),
      is_public = COALESCE($13, is_public),
      follower_count_raw = $14,
      boarding_status = $15,
      membership_tag = $16,
      data_check = $17,
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      req.params.id,
      d.name,
      d.ig_url ?? null,
      d.youtube_url ?? null,
      d.tiktok_url ?? null,
      d.follower_count,
      d.audience_profile ?? null,
      d.content_types,
      d.collaboration_types,
      d.collaboration_price ?? null,
      d.past_cases ?? null,
      d.open_to_contact,
      d.is_public,
      d.follower_count_raw ?? null,
      d.boarding_status ?? null,
      d.membership_tag ?? null,
      d.data_check ?? null,
    ]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到 KOL" });
  }
  res.json({ kol: result.rows[0] });
});

router.post("/:id/contact", requireAuth, requireRole("brand"), requireApproved, async (req, res) => {
  const { message } = req.body as { message?: string };
  const kol = await pool.query(`SELECT * FROM kol_profiles WHERE id = $1 AND is_public = true`, [
    req.params.id,
  ]);
  if (kol.rows.length === 0) {
    return res.status(404).json({ error: "找不到 KOL" });
  }
  if (!kol.rows[0].open_to_contact) {
    return res.status(400).json({ error: "此 KOL 目前不開放聯繫" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const conversation = await client.query<{ id: string; inserted: boolean }>(
      `INSERT INTO conversations (brand_user_id, conversation_type, title, target_kol_id)
       VALUES ($1,'kol_contact',$2,$3)
       ON CONFLICT (brand_user_id, target_kol_id)
         WHERE conversation_type='kol_contact' AND target_kol_id IS NOT NULL
       DO UPDATE SET updated_at=NOW()
       RETURNING id, (xmax=0) AS inserted`,
      [req.user!.id, `洽談：${kol.rows[0].name}`, req.params.id]
    );
    if (conversation.rows[0].inserted) {
      await client.query(
        `INSERT INTO conversation_messages (conversation_id, sender_user_id, body) VALUES ($1,$2,$3)`,
        [conversation.rows[0].id, req.user!.id, String(message ?? "希望進一步洽談合作").slice(0, 4000)]
      );
    }
    await client.query("COMMIT");
    res.json({
      ok: true,
      conversation_id: conversation.rows[0].id,
      message: conversation.rows[0].inserted ? "洽談案件已建立" : "已開啟既有洽談紀錄",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

export default router;
