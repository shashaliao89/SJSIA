import Image from "next/image";
import { Globe, ShieldCheck, Users } from "lucide-react";
import { SiteFooter } from "@/app/_components/SiteFooter";

export default function AboutPage() {
  return (
    <div className="text-white">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#00332B] via-[#002a24] to-[#001f1c] px-6 py-24 md:py-28">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/campaign/hyrox-silhouette.svg"
            alt=""
            fill
            className="object-cover opacity-40 blur-2xl scale-110"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#00332B]/70 via-[#00332B]/40 to-[#001a18]/90" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="site-eyebrow mb-4 tracking-[0.35em]">關於協會</p>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            盛家運動健康產業協會{" "}
            <span className="text-[#CFFF1A]">SJSIA</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg font-bold text-white/85 md:text-2xl">
            「連結影響力，放大商業價值。」
          </p>
        </div>
      </section>

      <section className="px-6 py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-[#CFFF1A] text-xl font-black tracking-widest mb-4 uppercase">
              About SJSIA
            </h2>
            <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              台灣運動產業
              <br />
              整合平台 / 信任中樞
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              運動健康產業不缺乏好產品，也不缺乏好內容，但缺乏
              <span className="text-white font-black">「精準的連結」</span>。盛家協會扮演資源撮合者的角色，
              讓品牌商資源精準流向具備影響力的創作者，實現 1 + 1 &gt; 2 的產業溢價。
            </p>
          </div>

          <div className="site-card p-8 md:p-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#CFFF1A]/20 rounded-lg text-[#CFFF1A]">
                  <Globe size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">跨域資源整合</h4>
                  <p className="text-gray-400 text-sm">
                    串接創作者、品牌、活動、媒體與賽事生態。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#CFFF1A]/20 rounded-lg text-[#CFFF1A]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">打造健康生活圈</h4>
                  <p className="text-gray-400 text-sm">
                    整合訓練、健康餐飲、營養補給、旅遊等異業合作。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#CFFF1A]/20 rounded-lg text-[#CFFF1A]">
                  <Users size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">專業流量變現</h4>
                  <p className="text-gray-400 text-sm">
                    提供集中、有效的合作平台，讓流量輕鬆變現。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

