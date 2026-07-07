import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import type { AuthUser, JwtPayload, UserRole } from "../types/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未登入" });
  }

  try {
    const token = header.slice(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");

    const payload = jwt.verify(token, secret) as JwtPayload;
    const result = await pool.query(
      `SELECT id, email, role, status, membership_expires_at FROM users WHERE id = $1`,
      [payload.sub]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "使用者不存在" });
    }
    req.user = result.rows[0] as AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: "登入已失效" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "權限不足" });
    }
    next();
  };
}

export function requireApproved(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "未登入" });
  if (req.user.role === "admin") return next();
  if (req.user.status !== "approved") {
    return res.status(403).json({ error: "帳號待審核或已停用" });
  }
  next();
}
