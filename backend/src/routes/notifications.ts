import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { syncGoogleSponsorshipsIfDue } from "../lib/google-sponsorships.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    await syncGoogleSponsorshipsIfDue();
  } catch (error) {
    console.error("Google sponsorship sync failed:", error instanceof Error ? error.message : error);
  }
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

  const sponsorshipInterests = await pool.query(
    `SELECT si.*, so.title AS opportunity_title, so.start_date, so.end_date,
       u.email AS from_email, bp.brand_name AS from_brand_name
     FROM sponsorship_interests si
     JOIN sponsorship_opportunities so ON so.slug=si.opportunity_slug
     JOIN users u ON u.id=si.brand_user_id
     LEFT JOIN brand_profiles bp ON bp.user_id=si.brand_user_id
     ORDER BY si.created_at DESC`
  );

  const unreadContacts = contacts.rows.filter((r) => !r.admin_read).length;
  const conversationUnread = await pool.query(
    `SELECT COUNT(*)::int AS count FROM conversation_messages cm
     JOIN conversations c ON c.id=cm.conversation_id
     JOIN users sender ON sender.id=cm.sender_user_id
     WHERE sender.role='brand' AND cm.created_at>COALESCE((
       SELECT last_read_at FROM conversation_reads WHERE conversation_id=c.id AND user_id=$1
     ), 'epoch')`,
    [req.user!.id]
  );

  res.json({
    contact_requests: contacts.rows,
    pending_applications: applications.rows,
    sponsorship_interests: sponsorshipInterests.rows,
    unread_count: Number(conversationUnread.rows[0]?.count ?? 0) + unreadContacts + applications.rows.length,
  });
});

router.patch("/sponsorship/:id/handled", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await pool.query(
    `UPDATE sponsorship_interests SET status='handled', admin_read=true, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "找不到通知" });
  res.json({ interest: result.rows[0] });
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
