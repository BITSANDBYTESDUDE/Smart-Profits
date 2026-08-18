import { NextResponse } from "next/server";
import { NOKIA_MOCK_PROFILES, mockGateLabel } from "@/lib/smart-guard/nokia-mock";

/** Hackathon mock Nokia NaC server — lists dummy numbers and CAMARA-shaped endpoints. */
export async function GET() {
  return NextResponse.json({
    name: "Smart Profits — Nokia NaC mock",
    mode: "simulator",
    note: "Use these CAMARA-shaped routes until NAC_API_KEY is set. Dummy numbers return Allowed / Denied / Step-up.",
    numbers: NOKIA_MOCK_PROFILES.map((row) => ({
      phoneNumber: row.phoneNumber,
      gate: row.gate,
      ar: mockGateLabel(row.gate, "ar"),
      en: mockGateLabel(row.gate, "en"),
      labelAr: row.labelAr,
      labelEn: row.labelEn,
    })),
    endpoints: [
      { method: "POST", path: "/api/nac/sim-swap/v1/check", body: { phoneNumber: "+99999991000", maxAge: 24 } },
      { method: "POST", path: "/api/nac/sim-swap/v1/retrieve-date", body: { phoneNumber: "+99999991000" } },
      { method: "POST", path: "/api/nac/number-verification/v1/verify", body: { phoneNumber: "+99999991001" } },
      {
        method: "POST",
        path: "/api/nac/location-verification/v1/verify",
        body: {
          device: { phoneNumber: "+99999991002" },
          area: { areaType: "CIRCLE", center: { latitude: 31.5017, longitude: 34.4668 }, radius: 2000 },
        },
      },
      {
        method: "POST",
        path: "/api/nac/mock/gate",
        body: { phoneNumber: "+99999991000", action: "file_upload", email: "demo@smartprofits.local" },
      },
    ],
  });
}
