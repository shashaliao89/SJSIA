import Link from "next/link";
import { SITE_VERSION } from "@/lib/site";
import { CONTACT, IG_OFFICIAL_URL } from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A] px-6 py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 text-3xl font-black italic text-[#CFFF1A]">SJSIA</div>
          <p className="max-w-xs font-bold leading-relaxed text-gray-500">
            運動產業的資源槓桿 — 連結、媒合、加速。
          </p>
        </div>
        <div className="grid gap-8 text-sm font-bold text-gray-400 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-white">聯絡資訊</p>
            <ul className="space-y-1.5">
              <li>
                <a
                  href={IG_OFFICIAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#CFFF1A]"
                >
                  Instagram：{CONTACT.instagram}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="hover:text-white">
                  電話：{CONTACT.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-white">
                  Email：{CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-white">快速連結</p>
            <ul className="space-y-1.5">
              <li>
                <Link href="/events" className="transition-colors hover:text-[#CFFF1A]">
                  活動公告
                </Link>
              </li>
              <li>
                <Link href="/plans" className="transition-colors hover:text-[#CFFF1A]">
                  入會方案
                </Link>
              </li>
              <li>
                <Link href="/team" className="transition-colors hover:text-[#CFFF1A]">
                  核心成員
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-7xl text-center text-xs font-bold text-gray-600">
        © {new Date().getFullYear()} SHENG JIA SPORTS &amp; HEALTH ASSOCIATION. ALL RIGHTS
        RESERVED.
        <span className="mx-2 opacity-40" aria-hidden>
          ·
        </span>
        <span className="text-gray-500">網站 v{SITE_VERSION}</span>
      </p>
    </footer>
  );
}
