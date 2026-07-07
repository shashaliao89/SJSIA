import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthUser } from "../types/index.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["brand", "kol"]),
  brandName: z.string().optional(),
  kolName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signToken(user: AuthUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: "7d" });
}

async function fetchUserWithProfile(userId: string) {
  const userResult = await pool.query(
    `SELECT id, email, role, status, membership_expires_at FROM users WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0] as AuthUser;
  if (!user) return null;

  let profile = null;
  if (user.role === "brand") {
    const r = await pool.query(`SELECT * FROM brand_profiles WHERE user_id = $1`, [userId]);
    profile = r.rows[0] ?? null;
  } else if (user.role === "kol") {
    const r = await pool.query(`SELECT * FROM kol_profiles WHERE user_id = $1`, [userId]);
    profile = r.rows[0] ?? null;
  }
  return { ...user, profile };
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password, role, brandName, kolName } = parsed.data;
  if (role === "brand" && !brandName) {
    return res.status(400).json({ error: "請填寫品牌名稱" });
  }
  if (role === "kol" && !kolName) {
    return res.status(400).json({ error: "請填寫 KOL 名稱" });
  }

  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "Email 已被使用" });
  }

  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, status)
       VALUES ($1, $2, $3, 'pending') RETURNING id, email, role, status, membership_expires_at`,
      [email, hash, role]
    );
    const user = userResult.rows[0] as AuthUser;

    if (role === "brand") {
      await client.query(
        `INSERT INTO brand_profiles (user_id, brand_name) VALUES ($1, $2)`,
        [user.id, brandName]
      );
    } else {
      await client.query(
        `INSERT INTO kol_profiles (user_id, name) VALUES ($1, $2)`,
        [user.id, kolName]
      );
    }

    await client.query("COMMIT");
    const token = signToken(user);
    const full = await fetchUserWithProfile(user.id);
    res.status(201).json({ token, user: full });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "註冊失敗" });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "請輸入有效的 Email 與密碼" });
  }

  const { email, password } = parsed.data;
  const result = await pool.query(
    `SELECT id, email, password_hash, role, status, membership_expires_at FROM users WHERE email = $1`,
    [email]
  );
  if (result.rows.length === 0) {
    return res.status(401).json({ error: "帳號或密碼錯誤" });
  }

  const row = result.rows[0];
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "帳號或密碼錯誤" });
  }

  const user = {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    membership_expires_at: row.membership_expires_at,
  } as AuthUser;

  const token = signToken(user);
  const full = await fetchUserWithProfile(user.id);
  res.json({ token, user: full });
});

router.get("/me", requireAuth, async (req, res) => {
  const full = await fetchUserWithProfile(req.user!.id);
  res.json({ user: full });
});

export default router;
