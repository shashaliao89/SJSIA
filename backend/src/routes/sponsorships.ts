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
    `SELECT slug, title FROM sponsorship_opportunities WHERE slug=$1 AND is_published=true`,
    [req.params.slug]
  );
  if (!opportunity.rows.length) return res.status(404).json({ error: "找不到此贊助機會" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO sponsorship_interests (opportunity_slug, brand_user_id) VALUES ($1,$2)
       ON CONFLICT (opportunity_slug, brand_user_id) DO UPDATE SET status='pending', admin_read=false, updated_at=NOW()`,
      [req.params.slug, req.user!.id]
    );
    const conversation = await client.query<{ id: string; inserted: boolean }>(
      `INSERT INTO conversations (brand_user_id, conversation_type, title, opportunity_slug)
       VALUES ($1,'commercial_opportunity',$2,$3)
       ON CONFLICT (brand_user_id, opportunity_slug)
         WHERE conversation_type='commercial_opportunity' AND opportunity_slug IS NOT NULL
       DO UPDATE SET withdrawn=false, status='pending', updated_at=NOW()
       RETURNING id, (xmax=0) AS inserted`,
      [req.user!.id, `商業合作：${opportunity.rows[0].title}`, req.params.slug]
    );
    if (conversation.rows[0].inserted) {
      await client.query(
        `INSERT INTO conversation_messages (conversation_id, sender_user_id, body) VALUES ($1,$2,$3)`,
        [conversation.rows[0].id, req.user!.id, `我對「${opportunity.rows[0].title}」有興趣，希望進一步了解合作方式。`]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true, conversation_id: conversation.rows[0].id, message: "已送出興趣登記，協會將與您聯繫" });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.delete("/:slug/interest", requireAuth, requireRole("brand"), requireApproved, async (req, res) => {
  const result = await pool.query(
    `DELETE FROM sponsorship_interests
     WHERE opportunity_slug=$1 AND brand_user_id=$2
     RETURNING id`,
    [req.params.slug, req.user!.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "目前沒有這筆興趣登記" });
  await pool.query(
    `UPDATE conversations SET withdrawn=true, updated_at=NOW()
     WHERE brand_user_id=$1 AND opportunity_slug=$2 AND conversation_type='commercial_opportunity'`,
    [req.user!.id, req.params.slug]
  );
  res.json({ ok: true, message: "已取消興趣登記" });
});

export default router;
