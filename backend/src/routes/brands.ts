import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole, requireApproved } from "../middleware/auth.js";

const router = Router();

const brandProfileSchema = z.object({
  brand_name: z.string().min(1),
  company_intro: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  open_to_contact: z.boolean().optional(),
  is_public: z.boolean().optional(),
});

router.get("/profile", requireAuth, requireRole("brand"), async (req, res) => {
  const result = await pool.query(`SELECT * FROM brand_profiles WHERE user_id = $1`, [req.user!.id]);
  res.json({ profile: result.rows[0] ?? null });
});

router.put("/profile", requireAuth, requireRole("brand"), async (req, res) => {
  const parsed = brandProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const d = parsed.data;
  const result = await pool.query(
    `UPDATE brand_profiles SET
      brand_name = $2,
      company_intro = $3,
      contact_name = $4,
      contact_phone = $5,
      open_to_contact = COALESCE($6, open_to_contact),
      is_public = COALESCE($7, is_public),
      updated_at = NOW()
     WHERE user_id = $1 RETURNING *`,
    [
      req.user!.id,
      d.brand_name,
      d.company_intro ?? null,
      d.contact_name ?? null,
      d.contact_phone ?? null,
      d.open_to_contact,
      d.is_public,
    ]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到品牌資料" });
  }
  res.json({ profile: result.rows[0] });
});

router.get("/", requireAuth, requireApproved, async (req, res) => {
  if (req.user!.role === "admin") {
    const result = await pool.query(
      `SELECT bp.*, u.email FROM brand_profiles bp
       JOIN users u ON u.id = bp.user_id
       WHERE u.status = 'approved'
       ORDER BY bp.created_at DESC`
    );
    return res.json({ brands: result.rows });
  }
  if (req.user!.role === "kol") {
    const result = await pool.query(
      `SELECT bp.* FROM brand_profiles bp
       JOIN users u ON u.id = bp.user_id
       WHERE bp.is_public = true AND u.status = 'approved'
       ORDER BY bp.brand_name ASC`
    );
    return res.json({ brands: result.rows });
  }
  return res.status(403).json({ error: "權限不足" });
});

router.post("/:id/contact", requireAuth, requireRole("kol"), requireApproved, async (req, res) => {
  const { message } = req.body as { message?: string };
  const brand = await pool.query(
    `SELECT bp.* FROM brand_profiles bp
     JOIN users u ON u.id = bp.user_id
     WHERE bp.id = $1 AND bp.is_public = true AND u.status = 'approved'`,
    [req.params.id]
  );
  if (brand.rows.length === 0) {
    return res.status(404).json({ error: "找不到品牌" });
  }
  if (!brand.rows[0].open_to_contact) {
    return res.status(400).json({ error: "此品牌目前不開放聯繫" });
  }

  await pool.query(
    `INSERT INTO contact_requests (from_user_id, target_type, target_profile_id, message)
     VALUES ($1, 'brand', $2, $3)`,
    [req.user!.id, req.params.id, message ?? "希望進一步洽談合作"]
  );

  res.json({ ok: true, message: "洽談申請已送出，協會將協助媒合" });
});

export default router;
