import { ImageResponse } from "next/og";

export const alt = "B&B Unikoop – SKF bearings, North Macedonia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#1a1a1a 0%,#2a2018 60%,#3a2410 100%)", color: "#f1f5f9" }}>
        <div style={{ fontSize: 30, letterSpacing: 8, color: "#FFAA22", display: "flex" }}>OFFICIAL SKF DISTRIBUTOR</div>
        <div style={{ fontSize: 120, fontWeight: 800, marginTop: 20, display: "flex" }}>B&amp;B UNIKOOP</div>
        <div style={{ fontSize: 40, marginTop: 20, color: "#94a3b8", display: "flex" }}>Bearings catalog · North Macedonia · bbunikoop.com.mk</div>
      </div>
    ),
    size
  );
}
