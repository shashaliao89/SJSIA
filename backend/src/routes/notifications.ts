import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  const contacts = await pool.query(
    `SELECT cr.*,
       u.email AS from_email, u.role AS from_role,
       kp.name AS kol_name, bp.brand_name AS target_brand_name,
       bp2.brand_name AS from_brand_name, kp2.name AS from_kol_name
     FROM contact_requests cr
     JOIN users u ON u.id = cr.from_user_id
     LEFT JOIN kol_profiles kp ON cr.target_type = 'kol' AND kp.id = cr.target_profile_id
     LEFT JOIN brand_profiles bp ON cr.target_type = 'brand' AND bp.id = cr.target_profile_id
     LEFT JOIN brand_profiles bp2 ON u.role = 'brand' AND bp2.user_id = u.id
     LEFT JOIN kol_profiles kp2 ON u.role = 'kol' AND kp2.user_id = u.id
     ORDER BY cr.created_at DESC`
  );

  const applications = await pool.query(
    `SELECT ca.*, c.title AS campaign_title, c.brand_name,
       u.email AS kol_email, kp.name AS kol_name
     FROM campaign_applications ca
     JOIN campaigns c ON c.id = ca.campaign_id
     JOIN users u ON u.id = ca.kol_user_id
     LEFT JOIN kol_profiles kp ON kp.user_id = ca.kol_user_id
     WHERE ca.status = 'pending'
     ORDER BY ca.created_at DESC`
  );

  const unreadContacts = contacts.rows.filter((r) => !r.admin_read).length;

  res.json({
    contact_requests: contacts.rows,
    pending_applications: applications.rows,
    unread_count: unreadContacts + applications.rows.length,
  });
});

router.patch("/contact/:id/read", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await pool.query(
    `UPDATE contact_requests SET admin_read = true, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到通知" });
  }
  res.json({ contact: result.rows[0] });
});

router.patch("/contact/:id/handled", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await pool.query(
    `UPDATE contact_requests SET status = 'handled', admin_read = true, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到通知" });
  }
  res.json({ contact: result.rows[0] });
});

export default router;
