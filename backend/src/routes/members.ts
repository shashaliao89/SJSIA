import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole, requireApproved } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", async (_req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.email, u.role, u.status, u.membership_expires_at, u.created_at,
            bp.brand_name, kp.name AS kol_name
     FROM users u
     LEFT JOIN brand_profiles bp ON bp.user_id = u.id
     LEFT JOIN kol_profiles kp ON kp.user_id = u.id
     WHERE u.role IN ('brand', 'kol')
     ORDER BY u.created_at DESC`
  );
  res.json({ members: result.rows });
});

const updateSchema = z.object({
  status: z.enum(["pending", "approved", "suspended"]).optional(),
  membership_expires_at: z.string().datetime().nullable().optional(),
});

router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { status, membership_expires_at } = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (status !== undefined) {
    fields.push(`status = $${i++}`);
    values.push(status);
  }
  if (membership_expires_at !== undefined) {
    fields.push(`membership_expires_at = $${i++}`);
    values.push(membership_expires_at);
  }
  if (fields.length === 0) {
    return res.status(400).json({ error: "無更新欄位" });
  }

  fields.push(`updated_at = NOW()`);
  values.push(req.params.id);

  const result = await pool.query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${i} AND role IN ('brand', 'kol')
     RETURNING id, email, role, status, membership_expires_at`,
    values
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到會員" });
  }
  res.json({ member: result.rows[0] });
});

export default router;
