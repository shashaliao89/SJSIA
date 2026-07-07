import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole, requireApproved } from "../middleware/auth.js";

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  experience_content: z.string().min(1),
  collaboration_terms: z.string().optional().nullable(),
  required_deliverables: z.string().optional().nullable(),
  application_deadline: z.string().optional().nullable(),
  status: z.enum(["active", "closed"]).optional(),
});

router.get("/", requireAuth, requireApproved, async (req, res) => {
  const role = req.user!.role;
  if (role === "admin") {
    const result = await pool.query(
      `SELECT p.*, bp.brand_name, u.email AS brand_email
       FROM products p
       JOIN users u ON u.id = p.brand_user_id
       LEFT JOIN brand_profiles bp ON bp.user_id = p.brand_user_id
       ORDER BY p.created_at DESC`
    );
    return res.json({ products: result.rows });
  }
  if (role === "brand") {
    const result = await pool.query(
      `SELECT * FROM products WHERE brand_user_id = $1 ORDER BY created_at DESC`,
      [req.user!.id]
    );
    return res.json({ products: result.rows });
  }
  if (role === "kol") {
    const result = await pool.query(
      `SELECT p.*, bp.brand_name,
              pa.id AS application_id, pa.status AS application_status
       FROM products p
       LEFT JOIN brand_profiles bp ON bp.user_id = p.brand_user_id
       LEFT JOIN product_applications pa ON pa.product_id = p.id AND pa.kol_user_id = $1
       WHERE p.status = 'active'
       ORDER BY p.application_deadline ASC NULLS LAST`,
      [req.user!.id]
    );
    return res.json({ products: result.rows });
  }
  return res.status(403).json({ error: "權限不足" });
});

router.post("/", requireAuth, requireRole("brand"), requireApproved, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const d = parsed.data;
  const result = await pool.query(
    `INSERT INTO products (
      brand_user_id, name, quantity, experience_content,
      collaboration_terms, required_deliverables, application_deadline
    ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      req.user!.id,
      d.name,
      d.quantity ?? 1,
      d.experience_content,
      d.collaboration_terms ?? null,
      d.required_deliverables ?? null,
      d.application_deadline ?? null,
    ]
  );
  res.status(201).json({ product: result.rows[0] });
});

router.put("/:id", requireAuth, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const role = req.user!.role;
  if (role !== "admin" && role !== "brand") {
    return res.status(403).json({ error: "權限不足" });
  }

  if (role === "brand") {
    const owned = await pool.query(
      `SELECT id FROM products WHERE id = $1 AND brand_user_id = $2`,
      [req.params.id, req.user!.id]
    );
    if (owned.rows.length === 0) {
      return res.status(403).json({ error: "權限不足" });
    }
  }

  const d = parsed.data;
  const result = await pool.query(
    `UPDATE products SET
      name = $2, quantity = COALESCE($3, quantity), experience_content = $4,
      collaboration_terms = $5, required_deliverables = $6,
      application_deadline = $7, status = COALESCE($8, status), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      req.params.id,
      d.name,
      d.quantity,
      d.experience_content,
      d.collaboration_terms ?? null,
      d.required_deliverables ?? null,
      d.application_deadline ?? null,
      d.status,
    ]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到產品" });
  }
  res.json({ product: result.rows[0] });
});

router.post("/:id/apply", requireAuth, requireRole("kol"), requireApproved, async (req, res) => {
  const { message } = req.body as { message?: string };
  const product = await pool.query(
    `SELECT id FROM products WHERE id = $1 AND status = 'active'`,
    [req.params.id]
  );
  if (product.rows.length === 0) {
    return res.status(404).json({ error: "找不到可申請的公關品" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO product_applications (product_id, kol_user_id, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user!.id, message ?? null]
    );
    res.status(201).json({ application: result.rows[0] });
  } catch {
    res.status(409).json({ error: "您已申請過此公關品" });
  }
});

router.get("/:id/applications", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await pool.query(
    `SELECT pa.*, kp.name AS kol_name, u.email
     FROM product_applications pa
     JOIN users u ON u.id = pa.kol_user_id
     LEFT JOIN kol_profiles kp ON kp.user_id = pa.kol_user_id
     WHERE pa.product_id = $1`,
    [req.params.id]
  );
  res.json({ applications: result.rows });
});

router.patch("/applications/:applicationId", requireAuth, requireRole("admin"), async (req, res) => {
  const { status, deliverable_status } = req.body as {
    status?: string;
    deliverable_status?: string;
  };
  const result = await pool.query(
    `UPDATE product_applications SET
      status = COALESCE($2, status),
      deliverable_status = COALESCE($3, deliverable_status),
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [req.params.applicationId, status, deliverable_status]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到申請" });
  }
  res.json({ application: result.rows[0] });
});

export default router;
