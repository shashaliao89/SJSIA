"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [loading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const path = await login(email, password);
      router.push(path);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登入失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="會員登入" subtitle="登入後將依角色導向對應 Dashboard">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="password">密碼</label>
          <input
            id="password"
            type="password"
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
          {submitting ? "登入中…" : "登入"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        還沒有帳號？{" "}
        <Link href="/register" className="font-bold text-[#CFFF1A] hover:underline">
          立即註冊
        </Link>
      </p>
    </AuthLayout>
  );
}

function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <Link href="/" className="text-sm font-black text-[#CFFF1A]">
          ← SJSIA Portal
        </Link>
        <h1 className="mt-4 text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
