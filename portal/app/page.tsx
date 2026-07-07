import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="text-xl font-black italic text-[#CFFF1A]">SJSIA</p>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3">
            <a
              href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
              className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm font-bold hover:border-[#CFFF1A]/40 sm:flex-none"
            >
              返回官網
            </a>
            <Link
              href="/login"
              className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm font-bold hover:border-[#CFFF1A]/40 sm:flex-none"
            >
              登入
            </Link>
            <Link
              href="/register"
              className="w-full rounded-xl bg-[#CFFF1A] px-4 py-2.5 text-center text-sm font-black text-black sm:w-auto"
            >
              註冊
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
        <p className="mb-3 text-xs font-black tracking-[0.3em] text-gray-500">MEMBER PORTAL</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
          盛家運動健康產業協會
          <span className="text-[#CFFF1A]"> 會員後台</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-400">
          品牌方、KOL 與協會管理員專用平台。媒合合作、申請協會活動，一站完成。
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { title: "品牌方 / 企業會員", desc: "瀏覽 KOL 資料庫、發布合作案件、報名協會活動。" },
            { title: "KOL / 個人會員", desc: "瀏覽品牌資料庫、申請合作機會、報名協會活動。" },
            { title: "協會管理員", desc: "媒合通知、審核會員、管理 KOL 與合作案件、舉辦活動。" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h3 className="text-lg font-black text-[#CFFF1A]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
