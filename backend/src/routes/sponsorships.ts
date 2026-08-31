import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireApproved, requireAuth, requireRole } from "../middleware/auth.js";
import { syncGoogleSponsorshipsIfDue } from "../lib/google-sponsorships.js";

const router = Router();

router.get("/", requireAuth, requireRole("brand"), requireApproved, async (req, res) => {
  try {
    await syncGoogleSponsorshipsIfDue();
  } catch (error) {
    console.error("Google sponsorship sync failed:", error instanceof Error ? error.message : error);
  }
  const result = await pool.query(
    `SELECT so.slug, so.title, so.start_date, so.end_date, so.deck_url,
       (si.id IS NOT NULL) AS interested
     FROM sponsorship_opportunities so
     LEFT JOIN sponsorship_interests si ON si.opportunity_slug=so.slug AND si.brand_user_id=$1
     WHERE so.is_published=true ORDER BY so.start_date ASC`,
    [req.user!.id]
  );
  res.json({ opportunities: result.rows });
});

router.post("/:slug/interest", requireAuth, requireRole("brand"), requireApproved, async (req, res) => {
  const opportunity = await pool.query(
    `SELECT slug FROM sponsorship_opportunities WHERE slug=$1 AND is_published=true`,
    [req.params.slug]
  );
  if (!opportunity.rows.length) return res.status(404).json({ error: "找不到此贊助機會" });
  await pool.query(
    `INSERT INTO sponsorship_interests (opportunity_slug, brand_user_id) VALUES ($1,$2)
     ON CONFLICT (opportunity_slug, brand_user_id) DO NOTHING`,
    [req.params.slug, req.user!.id]
  );
  res.json({ ok: true, message: "已送出興趣登記，協會將與您聯繫" });
});

export default router;
