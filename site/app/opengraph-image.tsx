import { ImageResponse } from "next/og";

export const alt = "盛家運動健康產業協會 SJSIA｜連結影響力，放大商業價值";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          color: "white",
          background: "linear-gradient(135deg, #071b18 0%, #0a0a0a 56%, #13220d 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: "#CFFF1A" }} />
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4 }}>SJSIA</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontSize: 62, lineHeight: 1.15, fontWeight: 900 }}>
            盛家運動健康產業協會
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#CFFF1A" }}>
            連結影響力，放大商業價值。
          </div>
          <div style={{ fontSize: 24, color: "#b7c1be" }}>
            運動場景 × 創作者社群 × 品牌資源 × 實體體驗
          </div>
        </div>
      </div>
    ),
    size
  );
}
