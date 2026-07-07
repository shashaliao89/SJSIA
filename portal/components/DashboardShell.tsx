"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
}

interface DashboardShellProps {
  role: "brand" | "kol" | "admin";
  title: string;
  nav: NavItem[];
  children: ReactNode;
}

export function DashboardShell({ role, title, nav, children }: DashboardShellProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        載入中…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-[#CFFF1A]">SJSIA PORTAL</p>
            <h1 className="text-xl font-black">{title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-gray-400 sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold hover:border-[#CFFF1A]/50"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      {user.status !== "approved" && user.role !== "admin" && (
        <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-6 py-3 text-center text-sm font-semibold text-yellow-200">
          您的帳號目前為「待審核」狀態，部分功能可能無法使用，請等待協會審核通過。
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  pathname === item.href
                    ? "bg-[#CFFF1A] text-black"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-black md:text-3xl">{title}</h2>
      {description ? <p className="mt-2 text-gray-400">{description}</p> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black transition-opacity disabled:opacity-50",
        variant === "primary" && "bg-[#CFFF1A] text-black hover:opacity-90",
        variant === "secondary" && "border border-white/15 text-white hover:border-[#CFFF1A]/40",
        variant === "danger" && "border border-red-500/40 text-red-300 hover:bg-red-500/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-white/10 text-gray-200",
    success: "bg-green-500/15 text-green-300",
    warning: "bg-yellow-500/15 text-yellow-200",
    danger: "bg-red-500/15 text-red-300",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
        tones[tone] ?? tones.default,
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <p className="text-center text-gray-400">{message}</p>
    </Card>
  );
}
