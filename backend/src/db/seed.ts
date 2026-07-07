import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool } from "./pool.js";

dotenv.config();

async function seed() {
  const email = process.env.ADMIN_EMAIL ?? "admin@sjsia.tw";
  const password = process.env.ADMIN_PASSWORD ?? "admin123456";
  const hash = await bcrypt.hash(password, 10);

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    console.log("Admin user already exists:", email);
    await pool.end();
    return;
  }

  await pool.query(
    `INSERT INTO users (email, password_hash, role, status)
     VALUES ($1, $2, 'admin', 'approved')`,
    [email, hash]
  );
  console.log("Admin user created:", email);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
