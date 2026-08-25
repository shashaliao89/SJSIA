"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function sendCode() {
    setError("");
    setMessage("");
    if (!email) return setError("請先輸入 Email");
    setSending(true);
    try {
      const data = await api<{ message: string }>("/api/auth/verification-code", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "register" }),
      });
      setMessage(data.message);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "驗證碼寄送失敗");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const path = await register({ email, password, brandName, verificationCode });
      router.push(path);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "註冊失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="inline-flex rounded-full border border-[#CFFF1A]/30 bg-[#CFFF1A]/10 px-3 py-1 text-xs font-black text-[#CFFF1A]">
        僅開放團體會員
      </div>
      <h1 className="mt-4 text-3xl font-black">建立團體會員帳號</h1>
      <p className="mt-2 text-sm leading-6 text-gray-400">
        完成 Email 驗證後即可進入品牌會員中心；部分合作功能需等待協會審核。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="brandName">品牌／公司名稱</label>
          <input id="brandName" required value={brandName} onChange={(event) => setBrandName(event.target.value)} />
        </div>
        <div>
          <label htmlFor="email">登入 Email</label>
          <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="verificationCode">Email 驗證碼</label>
            <button type="button" onClick={sendCode} disabled={sending} className="text-xs font-black text-[#CFFF1A] disabled:opacity-50">
              {sending ? "寄送中…" : "取得驗證碼"}
            </button>
          </div>
          <input
            id="verificationCode"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6 位數驗證碼"
            required
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div>
          <label htmlFor="password">設定密碼（至少 8 碼）</label>
          <input id="password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {message ? <p className="text-sm font-semibold text-[#CFFF1A]">{message}</p> : null}
        {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#CFFF1A] py-3 font-black text-black disabled:opacity-50">
          {submitting ? "建立帳號中…" : "建立團體會員帳號"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        已有帳號？ <Link href="/login" className="font-bold text-[#CFFF1A] hover:underline">返回登入</Link>
      </p>
    </AuthLayout>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0A0A0A] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <a href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"} className="text-sm font-black text-[#CFFF1A]">
          ← 返回協會官網
        </a>
        {children}
      </div>
    </div>
  );
}
