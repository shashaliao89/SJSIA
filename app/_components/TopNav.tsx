"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const FORM_URL = "https://forms.gle/A1C3eNhqE5s6LQ6f9";

const NAV_ITEMS = [
  { href: "/", label: "關於協會" },
  { href: "/events", label: "活動公告" },
  { href: "/team", label: "核心成員" },
  { href: "/plans", label: "入會方案" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-lg bg-[#0A0A0A]/80 border-b border-white/10"
        aria-label="主要導覽"
      >
        <div className="max-w-7xl mx-auto px-6 h-18 flex justify-between items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CFFF1A]"
          >
            <Image
              src="/campaign/logo.PNG"
              alt="SJSIA Logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-sm object-cover"
            />
            <span className="text-2xl font-black tracking-tighter italic text-white">
              SJSIA
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold tracking-widest">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "rounded-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CFFF1A]",
                    active ? "text-[#CFFF1A]" : "text-white hover:text-[#CFFF1A]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#CFFF1A] text-[#0A0A0A] px-4 py-2 sm:px-6 text-xs sm:text-sm font-black hover:scale-105 transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CFFF1A]"
            >
              立即加入
            </a>
            <button
              type="button"
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CFFF1A]"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
              aria-label={mobileOpen ? "關閉選單" : "開啟選單"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen ? (
        <div
          id="mobile-nav-panel"
          className="fixed inset-0 top-18 z-40 md:hidden flex flex-col bg-[#0A0A0A]/97 backdrop-blur-xl border-t border-white/10 px-6 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="手機版選單"
        >
          <div className="flex flex-col gap-2 text-lg font-black tracking-widest">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-xl px-4 py-4 border border-white/10",
                    active ? "text-[#CFFF1A] bg-white/5" : "text-white hover:bg-white/5",
                  ].join(" ")}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <a
            href={FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-auto rounded-2xl border border-[#CFFF1A]/40 bg-[#CFFF1A]/10 px-4 py-4 text-center font-black text-[#CFFF1A]"
            onClick={() => setMobileOpen(false)}
          >
            填寫入會申請書
          </a>
        </div>
      ) : null}
    </>
  );
}
