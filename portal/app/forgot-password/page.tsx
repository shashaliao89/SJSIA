"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function sendCode() {
    setError("");
    setMessage("");
    if (!email) return setError("請先輸入 Email");
    setSending(true);
    try {
      const data = await api<{ message: string }>("/api/auth/verification-code", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "reset_password" }),
      });
      setMessage(data.message);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "驗證碼寄送失敗");
    } finally {
      setSending(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await api<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, verificationCode, password }),
      });
      setMessage(data.message);
      setDone(true);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "密碼重設失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0A0A0A] px-4 py-8 text-white sm:px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <Link href="/login" className="text-sm font-black text-[#CFFF1A]">← 返回登入</Link>
        <h1 className="mt-4 text-3xl font-black">忘記密碼</h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">驗證碼將寄到會員帳號使用的 Email，10 分鐘內有效。</p>
        {done ? (
          <div className="mt-8 rounded-2xl border border-[#CFFF1A]/25 bg-[#CFFF1A]/10 p-5">
            <p className="font-bold text-[#CFFF1A]">{message}</p>
            <Link href="/login" className="mt-4 inline-block font-black text-white underline">使用新密碼登入</Link>
          </div>
        ) : (
          <form onSubmit={resetPassword} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email">會員 Email</label>
              <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="verificationCode">Email 驗證碼</label>
                <button type="button" onClick={sendCode} disabled={sending} className="text-xs font-black text-[#CFFF1A] disabled:opacity-50">
                  {sending ? "寄送中…" : "取得驗證碼"}
                </button>
              </div>
              <input id="verificationCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))} />
            </div>
            <div>
              <label htmlFor="password">新密碼（至少 8 碼）</label>
              <input id="password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            {message ? <p className="text-sm font-semibold text-[#CFFF1A]">{message}</p> : null}
            {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#CFFF1A] py-3 font-black text-black disabled:opacity-50">
              {submitting ? "更新中…" : "重設密碼"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
