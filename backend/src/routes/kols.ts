import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole, requireApproved } from "../middleware/auth.js";

const router = Router();

const kolSchema = z.object({
  name: z.string().min(1),
  ig_url: z.string().optional().nullable(),
  youtube_url: z.string().optional().nullable(),
  tiktok_url: z.string().optional().nullable(),
  follower_count: z.number().int().optional(),
  audience_profile: z.string().optional().nullable(),
  content_types: z.array(z.string()).optional(),
  collaboration_types: z.array(z.string()).optional(),
  collaboration_price: z.string().optional().nullable(),
  past_cases: z.string().optional().nullable(),
  open_to_contact: z.boolean().optional(),
  is_public: z.boolean().optional(),
  user_id: z.string().uuid().optional().nullable(),
});

router.get("/", requireAuth, requireApproved, async (req, res) => {
  if (req.user!.role === "admin") {
    const result = await pool.query(`SELECT * FROM kol_profiles ORDER BY created_at DESC`);
    return res.json({ kols: result.rows });
  }
  if (req.user!.role === "brand") {
    const result = await pool.query(
      `SELECT * FROM kol_profiles WHERE is_public = true ORDER BY follower_count DESC NULLS LAST`
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
      past_cases, open_to_contact, is_public
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
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

  await pool.query(
    `INSERT INTO contact_requests (from_user_id, target_type, target_profile_id, message)
     VALUES ($1, 'kol', $2, $3)`,
    [req.user!.id, req.params.id, message ?? "希望進一步洽談合作"]
  );

  res.json({ ok: true, message: "洽談申請已送出，協會將協助媒合" });
});

export default router;
