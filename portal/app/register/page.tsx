"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"brand" | "kol">("brand");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [kolName, setKolName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const path = await register({
        email,
        password,
        role,
        brandName: role === "brand" ? brandName : undefined,
        kolName: role === "kol" ? kolName : undefined,
      });
      router.push(path);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "註冊失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <Link href="/" className="text-sm font-black text-[#CFFF1A]">
          ← SJSIA Portal
        </Link>
        <h1 className="mt-4 text-3xl font-black">會員註冊</h1>
        <p className="mt-2 text-sm text-gray-400">註冊後需等待協會審核通過</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="role">會員類型</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as "brand" | "kol")}>
              <option value="brand">品牌方 / 企業會員</option>
              <option value="kol">KOL / 個人會員</option>
            </select>
          </div>
          {role === "brand" ? (
            <div>
              <label htmlFor="brandName">品牌名稱</label>
              <input
                id="brandName"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="kolName">KOL 名稱</label>
              <input
                id="kolName"
                required
                value={kolName}
                onChange={(e) => setKolName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">密碼（至少 6 碼）</label>
            <input
              id="password"
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#CFFF1A] py-3 font-black text-black disabled:opacity-50"
          >
            {submitting ? "註冊中…" : "註冊"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          已有帳號？{" "}
          <Link href="/login" className="font-bold text-[#CFFF1A] hover:underline">
            登入
          </Link>
        </p>
      </div>
    </div>
  );
}
