import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole, requireApproved } from "../middleware/auth.js";
import { syncOrganizedMembersIfDue } from "../db/sync-organized-members.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", async (_req, res) => {
  try {
    await syncOrganizedMembersIfDue();
  } catch (error) {
    console.error("Failed to sync organized member sheets:", error);
  }
  const registered = await pool.query(
    `SELECT u.id, u.email, u.role, u.status, u.membership_expires_at, u.created_at,
            bp.brand_name, kp.name AS kol_name
     FROM users u
     LEFT JOIN brand_profiles bp ON bp.user_id = u.id
     LEFT JOIN kol_profiles kp ON kp.user_id = u.id
     WHERE u.role IN ('brand', 'kol')
     ORDER BY u.created_at DESC`
  );
  const imported = await pool.query(
    `SELECT id, email, member_type AS role, review_status AS status, NULL::timestamptz AS membership_expires_at,
            created_at, CASE WHEN member_type = 'brand' THEN display_name END AS brand_name,
            CASE WHEN member_type = 'kol' THEN display_name END AS kol_name,
            true AS imported, source_row, instagram_url, website_url, follower_count,
            collaboration_price, boarding_status, representative_name, line_id, application_note, synced_at
     FROM imported_members ORDER BY source_row DESC`
  );
  res.json({ members: [...registered.rows, ...imported.rows] });
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

  if (status !== undefined) {
    const importedResult = await pool.query(
      `UPDATE imported_members SET review_status = $2, updated_at = NOW()
       WHERE id = $1 RETURNING id, email, member_type AS role, review_status AS status,
       NULL::timestamptz AS membership_expires_at`,
      [req.params.id, status]
    );
    if (importedResult.rows.length) return res.json({ member: importedResult.rows[0] });
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
