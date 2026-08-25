import { createHash, randomInt } from "crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { sendVerificationEmail } from "../lib/email.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthUser } from "../types/index.js";

const router = Router();
const emailSchema = z.string().email().transform((value) => value.trim().toLowerCase());
const codeSchema = z.string().regex(/^\d{6}$/, "請輸入 6 位數驗證碼");
const requestCodeSchema = z.object({
  email: emailSchema,
  purpose: z.enum(["register", "reset_password"]),
});
const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "密碼至少需要 8 碼"),
  brandName: z.string().trim().min(1, "請填寫品牌名稱"),
  verificationCode: codeSchema,
}).strict();
const loginSchema = z.object({ email: emailSchema, password: z.string() });
const resetPasswordSchema = z.object({
  email: emailSchema,
  verificationCode: codeSchema,
  password: z.string().min(8, "密碼至少需要 8 碼"),
});

function signToken(user: AuthUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: "7d" });
}

function codeHash(email: string, purpose: string, code: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return createHash("sha256").update(`${email}:${purpose}:${code}:${secret}`).digest("hex");
}

async function consumeCode(
  client: { query: (query: string, values?: unknown[]) => Promise<{ rows: any[] }> },
  email: string,
  purpose: "register" | "reset_password",
  code: string
) {
  const result = await client.query(
    `SELECT id, code_hash, attempts, expires_at
     FROM auth_verification_codes
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
    [email, purpose]
  );
  const row = result.rows[0];
  if (!row || new Date(row.expires_at) <= new Date() || row.attempts >= 5) {
    throw new Error("驗證碼已失效，請重新取得");
  }
  if (row.code_hash !== codeHash(email, purpose, code)) {
    await client.query(`UPDATE auth_verification_codes SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
    throw new Error("驗證碼錯誤");
  }
  await client.query(`UPDATE auth_verification_codes SET consumed_at = NOW() WHERE id = $1`, [row.id]);
}

async function fetchUserWithProfile(userId: string) {
  const userResult = await pool.query(
    `SELECT id, email, role, status, membership_expires_at, email_verified_at FROM users WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0] as AuthUser;
  if (!user) return null;
  let profile = null;
  if (user.role === "brand") {
    const result = await pool.query(`SELECT * FROM brand_profiles WHERE user_id = $1`, [userId]);
    profile = result.rows[0] ?? null;
  } else if (user.role === "kol") {
    const result = await pool.query(`SELECT * FROM kol_profiles WHERE user_id = $1`, [userId]);
    profile = result.rows[0] ?? null;
  }
  return { ...user, profile };
}

router.post("/verification-code", async (req, res) => {
  const parsed = requestCodeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "請輸入有效的 Email" });
  const { email, purpose } = parsed.data;
  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (purpose === "register" && existing.rows.length > 0) {
    return res.status(409).json({ error: "Email 已被使用" });
  }
  if (purpose === "reset_password" && existing.rows.length === 0) {
    return res.json({ message: "若此 Email 已註冊，驗證碼將寄至信箱" });
  }
  const recent = await pool.query(
    `SELECT created_at FROM auth_verification_codes
     WHERE email = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1`,
    [email, purpose]
  );
  if (recent.rows[0] && Date.now() - new Date(recent.rows[0].created_at).getTime() < 60_000) {
    return res.status(429).json({ error: "請等待 60 秒後再重新寄送" });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const inserted = await pool.query(
    `INSERT INTO auth_verification_codes (email, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes') RETURNING id`,
    [email, purpose, codeHash(email, purpose, code)]
  );
  try {
    await sendVerificationEmail({ email, code, purpose });
  } catch (error) {
    await pool.query(`DELETE FROM auth_verification_codes WHERE id = $1`, [inserted.rows[0].id]);
    console.error("Failed to send verification email:", error);
    return res.status(503).json({ error: "驗證信暫時無法寄出，請稍後再試或聯繫協會" });
  }
  res.json({ message: "驗證碼已寄出，10 分鐘內有效" });
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, brandName, verificationCode } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Email 已被使用" });
    }
    await consumeCode(client, email, "register", verificationCode);
    const hash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, status, email_verified_at)
       VALUES ($1, $2, 'brand', 'pending', NOW())
       RETURNING id, email, role, status, membership_expires_at, email_verified_at`,
      [email, hash]
    );
    const user = userResult.rows[0] as AuthUser;
    await client.query(`INSERT INTO brand_profiles (user_id, brand_name) VALUES ($1, $2)`, [user.id, brandName]);
    await client.query("COMMIT");
    res.status(201).json({ token: signToken(user), user: await fetchUserWithProfile(user.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "註冊失敗";
    await client.query(message.includes("驗證碼") ? "COMMIT" : "ROLLBACK");
    res.status(message.includes("驗證碼") ? 400 : 500).json({ error: message });
  } finally {
    client.release();
  }
});

router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, verificationCode, password } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (!existing.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "驗證碼錯誤或已失效" });
    }
    await consumeCode(client, email, "reset_password", verificationCode);
    const hash = await bcrypt.hash(password, 10);
    await client.query(`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE email = $1`, [email, hash]);
    await client.query("COMMIT");
    res.json({ message: "密碼已更新，請使用新密碼登入" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "密碼重設失敗";
    await client.query(message.includes("驗證碼") ? "COMMIT" : "ROLLBACK");
    res.status(400).json({ error: message });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "請輸入有效的 Email 與密碼" });
  const { email, password } = parsed.data;
  const result = await pool.query(
    `SELECT id, email, password_hash, role, status, membership_expires_at FROM users WHERE email = $1`,
    [email]
  );
  const row = result.rows[0];
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return res.status(401).json({ error: "帳號或密碼錯誤" });
  }
  if (row.status === "suspended") return res.status(403).json({ error: "此帳號已停用，請聯繫協會管理員" });
  if (row.membership_expires_at && new Date(row.membership_expires_at) <= new Date()) {
    return res.status(403).json({ error: "會員資格已到期，請聯繫協會續約" });
  }
  const user = {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    membership_expires_at: row.membership_expires_at,
  } as AuthUser;
  res.json({ token: signToken(user), user: await fetchUserWithProfile(user.id) });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: await fetchUserWithProfile(req.user!.id) });
});

export default router;
