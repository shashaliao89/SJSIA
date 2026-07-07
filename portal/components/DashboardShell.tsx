"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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

function NavLinks({
  nav,
  pathname,
  onNavigate,
  className,
  linkClassName,
}: {
  nav: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  className?: string;
  linkClassName?: (active: boolean) => string;
}) {
  return (
    <nav className={className}>
      {nav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-[#CFFF1A] text-black" : "text-gray-300 hover:bg-white/5 hover:text-white",
              linkClassName?.(active)
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ role, title, nav, children }: DashboardShellProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-gray-400">
        載入中…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-widest text-[#CFFF1A] sm:text-xs">SJSIA PORTAL</p>
            <h1 className="truncate text-lg font-black sm:text-xl">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white hover:bg-white/5 lg:hidden"
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? "關閉選單" : "開啟選單"}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <span className="hidden max-w-[12rem] truncate text-sm text-gray-400 md:inline">{user.email}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:border-[#CFFF1A]/50"
            >
              登出
            </button>
          </div>
        </div>

        {/* 手機：橫向滑動快捷導覽 */}
        <div className="border-t border-white/10 px-4 pb-3 pt-2 lg:hidden">
          <NavLinks
            nav={nav}
            pathname={pathname}
            className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            linkClassName={(active) =>
              cn(
                "shrink-0 whitespace-nowrap px-4 py-2.5 text-sm",
                active ? "bg-[#CFFF1A] text-black" : "border border-white/10 bg-white/[0.03]"
              )
            }
          />
        </div>
      </header>

      {user.status !== "approved" && user.role !== "admin" && (
        <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-center text-sm font-semibold leading-relaxed text-yellow-200 sm:px-6">
          您的帳號目前為「待審核」狀態，部分功能可能無法使用，請等待協會審核通過。
        </div>
      )}

      {/* 手機全屏選單 */}
      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="導覽選單"
        >
          <div className="flex h-full flex-col px-4 pb-6 pt-20">
            <NavLinks
              nav={nav}
              pathname={pathname}
              onNavigate={() => setMobileNavOpen(false)}
              className="flex flex-col gap-2"
              linkClassName={() => "px-4 py-3.5 text-base"}
            />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="hidden h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-3 lg:block">
          <NavLinks nav={nav} pathname={pathname} className="flex flex-col gap-1" />
        </aside>
        <main className="min-w-0">{children}</main>
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
