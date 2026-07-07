import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole, requireApproved } from "../middleware/auth.js";

const router = Router();

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  event_date: z.string(),
  location: z.string().optional().nullable(),
  max_participants: z.number().int().optional().nullable(),
  allow_brand_exposure: z.boolean().optional(),
});

router.get("/", requireAuth, requireApproved, async (req, res) => {
  const role = req.user!.role;
  const events = await pool.query(`SELECT * FROM events ORDER BY event_date ASC`);

  if (role === "admin") {
    return res.json({ events: events.rows });
  }

  const withRegistration = await pool.query(
    `SELECT e.*, er.id AS registration_id, er.exposure_requested, er.status AS registration_status
     FROM events e
     LEFT JOIN event_registrations er ON er.event_id = e.id AND er.user_id = $1
     ORDER BY e.event_date ASC`,
    [req.user!.id]
  );
  res.json({ events: withRegistration.rows });
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return res.status(400).json({
      error: first ? `${first.path.join(".")}: ${first.message}` : "資料格式錯誤",
    });
  }
  const d = parsed.data;
  const result = await pool.query(
    `INSERT INTO events (title, description, event_date, location, max_participants, allow_brand_exposure)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      d.title,
      d.description ?? null,
      d.event_date,
      d.location ?? null,
      d.max_participants ?? null,
      d.allow_brand_exposure ?? false,
    ]
  );
  res.status(201).json({ event: result.rows[0] });
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return res.status(400).json({
      error: first ? `${first.path.join(".")}: ${first.message}` : "資料格式錯誤",
    });
  }
  const d = parsed.data;
  const result = await pool.query(
    `UPDATE events SET
      title = $2, description = $3, event_date = $4, location = $5,
      max_participants = $6, allow_brand_exposure = COALESCE($7, allow_brand_exposure),
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      req.params.id,
      d.title,
      d.description ?? null,
      d.event_date,
      d.location ?? null,
      d.max_participants ?? null,
      d.allow_brand_exposure,
    ]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到活動" });
  }
  res.json({ event: result.rows[0] });
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await pool.query(`DELETE FROM events WHERE id = $1 RETURNING id`, [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到活動" });
  }
  res.json({ ok: true });
});

router.post("/:id/register", requireAuth, requireApproved, async (req, res) => {
  const { exposure_requested } = req.body as { exposure_requested?: boolean };
  const role = req.user!.role;

  const event = await pool.query(`SELECT * FROM events WHERE id = $1`, [req.params.id]);
  if (event.rows.length === 0) {
    return res.status(404).json({ error: "找不到活動" });
  }

  const ev = event.rows[0];
  if (role === "brand" && exposure_requested && !ev.allow_brand_exposure) {
    return res.status(400).json({ error: "此活動不開放品牌露出申請" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO event_registrations (event_id, user_id, registrant_name, registrant_email, is_member, exposure_requested)
       VALUES ($1, $2, $3, $4, true, $5) RETURNING *`,
      [
        req.params.id,
        req.user!.id,
        req.user!.email,
        req.user!.email,
        role === "brand" ? !!exposure_requested : false,
      ]
    );
    res.status(201).json({ registration: result.rows[0] });
  } catch {
    res.status(409).json({ error: "您已報名此活動" });
  }
});

router.delete("/:id/register", requireAuth, requireApproved, async (req, res) => {
  const result = await pool.query(
    `DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, req.user!.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到報名紀錄" });
  }
  res.json({ ok: true });
});

router.get("/:id/registrations", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await pool.query(
    `SELECT er.*, u.email, u.role, bp.brand_name, kp.name AS kol_name
     FROM event_registrations er
     LEFT JOIN users u ON u.id = er.user_id
     LEFT JOIN brand_profiles bp ON bp.user_id = er.user_id
     LEFT JOIN kol_profiles kp ON kp.user_id = er.user_id
     WHERE er.event_id = $1
     ORDER BY er.created_at DESC`,
    [req.params.id]
  );
  res.json({ registrations: result.rows });
});

router.patch("/registrations/:registrationId", requireAuth, requireRole("admin"), async (req, res) => {
  const { attended, status } = req.body as { attended?: boolean; status?: string };
  const result = await pool.query(
    `UPDATE event_registrations SET
      attended = COALESCE($2, attended),
      status = COALESCE($3, status),
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [req.params.registrationId, attended, status]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "找不到報名紀錄" });
  }
  res.json({ registration: result.rows[0] });
});

export default router;
