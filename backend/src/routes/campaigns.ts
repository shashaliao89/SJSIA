import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole, requireApproved } from "../middleware/auth.js";

const router = Router();

const campaignSchema = z.object({
  title: z.string().min(1),
  brand_name: z.string().min(1),
  product_service_intro: z.string().min(1),
  budget: z.string().optional().nullable(),
  target_kol_types: z.array(z.string()).optional(),
  event_date: z.string().optional().nullable(),
  content_description: z.string().min(1),
  reward_description: z.string().optional().nullable(),
  application_deadline: z.string().optional().nullable(),
  status: z.enum(["pending_review", "approved", "rejected", "closed"]).optional(),
});

router.get("/", requireAuth, requireApproved, async (req, res) => {
  const role = req.user!.role;
  if (role === "admin") {
    const result = await pool.query(
      `SELECT c.*, u.email AS brand_email FROM campaigns c
       JOIN users u ON u.id = c.brand_user_id ORDER BY c.created_at DESC`
    );
    return res.json({ campaigns: result.rows });
  }
  if (role === "brand") {
    const result = await pool.query(
      `SELECT * FROM campaigns WHERE brand_user_id = $1 ORDER BY created_at DESC`,
      [req.user!.id]
    );
    return res.json({ campaigns: result.rows });
  }
  if (role === "kol") {
    const result = await pool.query(
      `SELECT c.*, bp.brand_name AS profile_brand_name,
         ca.id AS application_id, ca.status AS application_status
       FROM campaigns c
       LEFT JOIN brand_profiles bp ON bp.user_id = c.brand_user_id
       LEFT JOIN campaign_applications ca ON ca.campaign_id = c.id AND ca.kol_user_id = $1
       WHERE c.status = 'approved'
       ORDER BY c.application_deadline ASC NULLS LAST`,
      [req.user!.id]
    );
    return res.json({ campaigns: result.rows });
  }
  return res.status(403).json({ error: "權限不足" });
});

router.post("/", requireAuth, requireRole("brand"), requireApproved, async (req, res) => {
  const parsed = campaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const d = parsed.data;
  const result = await pool.query(
    `INSERT INTO campaigns (
      brand_user_id, title, brand_name, product_service_intro, budget,
      target_kol_types, event_date, content_description, reward_description,
      application_deadline, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending_review') RETURNING *`,
    [
      req.user!.id,
      d.title,
      d.brand_name,
      d.product_service_intro,
      d.budget ?? null,
      d.target_kol_types ?? [],
      d.event_date ?? null,
      d.content_description,
      d.reward_description ?? null,
      d.application_deadline ?? null,
    ]
  );
  res.status(201).json({ campaign: result.rows[0] });
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = campaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const d = parsed.data;
  const result = await pool.query(
    `UPDATE campaigns SET
      title = $2, brand_name = $3, product_service_intro = $4, budget = $5,
      target_kol_types = COALESCE($6, target_kol_types),
      event_date = $7, content_description = $8, reward_description = $9,
      application_deadline = $10,
      status = COALESCE($11, status),
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      req.params.id,
      d.title,
      d.brand_name,
      d.product_service_intro,
      d.budget ?? null,
      d.target_kol_types,
      d.event_date ?? null,
      d.content_description,
      d.reward_description ?? null,
      d.application_deadline ?? null,
      d.status,
    ]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到案件" });
  }
  res.json({ campaign: result.rows[0] });
});

router.post("/:id/apply", requireAuth, requireRole("kol"), requireApproved, async (req, res) => {
  const { message } = req.body as { message?: string };
  const campaign = await pool.query(
    `SELECT id FROM campaigns WHERE id = $1 AND status = 'approved'`,
    [req.params.id]
  );
  if (campaign.rows.length === 0) {
    return res.status(404).json({ error: "找不到開放中的合作案" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO campaign_applications (campaign_id, kol_user_id, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user!.id, message ?? null]
    );
    res.status(201).json({ application: result.rows[0] });
  } catch {
    res.status(409).json({ error: "您已申請過此合作案" });
  }
});

router.get("/:id/applications", requireAuth, async (req, res) => {
  const role = req.user!.role;
  if (role === "admin") {
    const result = await pool.query(
      `SELECT ca.*, u.email, kp.name AS kol_name
       FROM campaign_applications ca
       JOIN users u ON u.id = ca.kol_user_id
       LEFT JOIN kol_profiles kp ON kp.user_id = ca.kol_user_id
       WHERE ca.campaign_id = $1`,
      [req.params.id]
    );
    return res.json({ applications: result.rows });
  }
  if (role === "brand") {
    const owned = await pool.query(
      `SELECT id FROM campaigns WHERE id = $1 AND brand_user_id = $2`,
      [req.params.id, req.user!.id]
    );
    if (owned.rows.length === 0) {
      return res.status(403).json({ error: "權限不足" });
    }
    const result = await pool.query(
      `SELECT ca.*, kp.name AS kol_name, u.email AS kol_email
       FROM campaign_applications ca
       LEFT JOIN kol_profiles kp ON kp.user_id = ca.kol_user_id
       LEFT JOIN users u ON u.id = ca.kol_user_id
       WHERE ca.campaign_id = $1 AND ca.status = 'approved'`,
      [req.params.id]
    );
    return res.json({ applications: result.rows });
  }
  return res.status(403).json({ error: "權限不足" });
});

router.patch("/applications/:applicationId", requireAuth, requireRole("admin"), async (req, res) => {
  const { status } = req.body as { status?: string };
  if (!status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "請提供有效的審核狀態" });
  }
  const result = await pool.query(
    `UPDATE campaign_applications SET status = $2, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [req.params.applicationId, status]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到申請紀錄" });
  }
  res.json({ application: result.rows[0] });
});

export default router;
