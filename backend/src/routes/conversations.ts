import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireApproved, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireApproved, requireRole("brand", "admin"));

const messageSchema = z.object({ body: z.string().trim().min(1).max(4000) });
const marketingSchema = z.object({
  template: z.enum(["30k", "200k", "500k", "custom"]),
  brand_product: z.string().trim().min(1).max(500),
  marketing_goal: z.string().trim().min(1).max(1000),
  target_audience: z.string().trim().min(1).max(1000),
  industry: z.string().trim().min(1).max(200),
  period: z.string().trim().min(1).max(200),
  platforms: z.string().trim().min(1).max(500),
  content_formats: z.string().trim().min(1).max(500),
  expected_kpi: z.string().trim().min(1).max(1000),
  budget: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).optional().default(""),
});
const sponsorshipSchema = z.object({
  direction: z.enum(["seek", "offer"]),
  title: z.string().trim().min(1).max(255),
  item: z.string().trim().min(1).max(500),
  quantity: z.number().int().positive().max(1_000_000),
  expected_value: z.string().trim().min(1).max(500),
  target_audience: z.string().trim().min(1).max(1000),
  event_type: z.string().trim().min(1).max(300),
  industry: z.string().trim().min(1).max(300),
  available_date: z.string().trim().min(1).max(100),
  logistics: z.string().trim().min(1).max(1500),
  description: z.string().trim().min(1).max(2500),
});
const statusSchema = z.object({ status: z.enum(["pending", "in_progress", "closed"]) });

function summary(labelled: Array<[string, unknown]>) {
  return labelled.map(([label, value]) => `${label}：${String(value ?? "")}`).join("\n");
}

async function createConversationWithMessage(input: {
  brandUserId: string;
  type: string;
  title: string;
  metadata: Record<string, unknown>;
  message: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const conversation = await client.query(
      `INSERT INTO conversations (brand_user_id, conversation_type, title, metadata)
       VALUES ($1,$2,$3,$4::jsonb) RETURNING *`,
      [input.brandUserId, input.type, input.title, JSON.stringify(input.metadata)]
    );
    await client.query(
      `INSERT INTO conversation_messages (conversation_id, sender_user_id, body)
       VALUES ($1,$2,$3)`,
      [conversation.rows[0].id, input.brandUserId, input.message]
    );
    await client.query("COMMIT");
    return conversation.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const type = String(req.query.type ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  const values: unknown[] = [];
  const where: string[] = [];
  if (req.user!.role === "brand") {
    values.push(req.user!.id);
    where.push(`c.brand_user_id=$${values.length}`);
  }
  if (type) {
    values.push(type);
    where.push(`c.conversation_type=$${values.length}`);
  }
  if (status) {
    values.push(status);
    where.push(`c.status=$${values.length}`);
  }
  values.push(limit, (page - 1) * limit, req.user!.id);
  const result = await pool.query(
    `SELECT c.*, bp.brand_name, u.email AS brand_email, kp.name AS kol_name, kp.avatar_url AS kol_avatar_url,
       (SELECT body FROM conversation_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
       (SELECT COUNT(*)::int FROM conversation_messages cm
        WHERE cm.conversation_id=c.id AND cm.sender_user_id<>$${values.length}
          AND cm.created_at>COALESCE((SELECT last_read_at FROM conversation_reads
            WHERE conversation_id=c.id AND user_id=$${values.length}), 'epoch')) AS unread_count
     FROM conversations c
     JOIN users u ON u.id=c.brand_user_id
     LEFT JOIN brand_profiles bp ON bp.user_id=c.brand_user_id
     LEFT JOIN kol_profiles kp ON kp.id=c.target_kol_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY c.last_message_at DESC LIMIT $${values.length - 2} OFFSET $${values.length - 1}`,
    values
  );
  res.json({ conversations: result.rows, page, limit });
});

router.get("/marketing-benefit", requireRole("brand"), async (req, res) => {
  const result = await pool.query(
    `SELECT id, created_at
     FROM conversations
     WHERE brand_user_id=$1 AND conversation_type='marketing_request'
       AND metadata->>'template'='30k'
     ORDER BY created_at ASC LIMIT 1`,
    [req.user!.id]
  );
  res.json({
    available: result.rows.length === 0,
    used: result.rows.length > 0,
    conversation_id: result.rows[0]?.id ?? null,
    used_at: result.rows[0]?.created_at ?? null,
  });
});

router.post("/support", requireRole("brand"), async (req, res) => {
  const existing = await pool.query(
    `SELECT * FROM conversations
     WHERE brand_user_id=$1 AND conversation_type='general_support' AND status<>'closed'
     ORDER BY created_at DESC LIMIT 1`,
    [req.user!.id]
  );
  if (existing.rows.length) return res.json({ conversation: existing.rows[0], created: false });

  const conversation = await createConversationWithMessage({
    brandUserId: req.user!.id,
    type: "general_support",
    title: "聯繫協會管理員",
    metadata: { source: "brand_case_center" },
    message: "您好，我想聯繫協會管理員。",
  });
  res.status(201).json({ conversation, created: true });
});

router.post("/marketing", requireRole("brand"), async (req, res) => {
  const parsed = marketingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  if (d.template === "30k") {
    const existing = await pool.query(
      `SELECT id FROM conversations
       WHERE brand_user_id=$1 AND conversation_type='marketing_request'
         AND metadata->>'template'='30k' LIMIT 1`,
      [req.user!.id]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: "每位團體會員僅可使用一次 3 萬方案，此權益已使用" });
    }
  }
  try {
    const conversation = await createConversationWithMessage({
      brandUserId: req.user!.id,
      type: "marketing_request",
      title: `客製化行銷需求｜${d.brand_product}`,
      metadata: d,
      message: summary([
        ["品牌及產品", d.brand_product], ["行銷目標", d.marketing_goal], ["目標受眾", d.target_audience],
        ["產業類型", d.industry], ["執行期間", d.period], ["希望平台", d.platforms],
        ["內容形式", d.content_formats], ["預期 KPI", d.expected_kpi], ["預算", d.budget], ["補充需求", d.notes],
      ]),
    });
    res.status(201).json({ conversation });
  } catch (error) {
    if (d.template === "30k" && typeof error === "object" && error && "code" in error && error.code === "23505") {
      return res.status(409).json({ error: "每位團體會員僅可使用一次 3 萬方案，此權益已使用" });
    }
    throw error;
  }
});

router.post("/sponsorship", requireRole("brand"), async (req, res) => {
  const parsed = sponsorshipSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  const conversation = await createConversationWithMessage({
    brandUserId: req.user!.id,
    type: d.direction === "seek" ? "sponsorship_seek" : "sponsorship_offer",
    title: d.title,
    metadata: d,
    message: summary([
      [d.direction === "seek" ? "尋求品項" : "提供品項", d.item], ["數量", d.quantity],
      ["預算／期待價值", d.expected_value], ["目標客群", d.target_audience], ["活動類型", d.event_type],
      ["產業類型", d.industry], ["日期", d.available_date], ["物流與條件", d.logistics], ["詳細說明", d.description],
    ]),
  });
  res.status(201).json({ conversation });
});

async function accessibleConversation(id: string, user: Express.Request["user"]) {
  const values: unknown[] = [id];
  let ownership = "";
  if (user!.role === "brand") {
    values.push(user!.id);
    ownership = " AND c.brand_user_id=$2";
  }
  return pool.query(`SELECT c.* FROM conversations c WHERE c.id=$1${ownership}`, values);
}

router.get("/:id/messages", async (req, res) => {
  const conversation = await accessibleConversation(req.params.id, req.user);
  if (!conversation.rows.length) return res.status(404).json({ error: "找不到此對話" });
  const messages = await pool.query(
    `SELECT cm.id, cm.body, cm.created_at, cm.sender_user_id, u.role AS sender_role, u.email AS sender_email
     FROM conversation_messages cm JOIN users u ON u.id=cm.sender_user_id
     WHERE cm.conversation_id=$1 ORDER BY cm.created_at ASC LIMIT 500`,
    [req.params.id]
  );
  await pool.query(
    `INSERT INTO conversation_reads (conversation_id, user_id) VALUES ($1,$2)
     ON CONFLICT (conversation_id, user_id) DO UPDATE SET last_read_at=NOW()`,
    [req.params.id, req.user!.id]
  );
  res.json({ conversation: conversation.rows[0], messages: messages.rows });
});

router.post("/:id/messages", async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "訊息需為 1–4000 字" });
  const conversation = await accessibleConversation(req.params.id, req.user);
  if (!conversation.rows.length) return res.status(404).json({ error: "找不到此對話" });
  if (conversation.rows[0].status === "closed") return res.status(400).json({ error: "此案件已結案" });
  const message = await pool.query(
    `INSERT INTO conversation_messages (conversation_id, sender_user_id, body) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, req.user!.id, parsed.data.body]
  );
  await pool.query(
    `UPDATE conversations SET last_message_at=NOW(), updated_at=NOW(),
       status=CASE WHEN status='pending' THEN 'in_progress' ELSE status END WHERE id=$1`,
    [req.params.id]
  );
  res.status(201).json({ message: message.rows[0] });
});

router.patch("/:id/status", requireRole("admin"), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "狀態格式錯誤" });
  const result = await pool.query(
    `UPDATE conversations SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [req.params.id, parsed.data.status]
  );
  if (!result.rows.length) return res.status(404).json({ error: "找不到此案件" });
  res.json({ conversation: result.rows[0] });
});

export default router;
