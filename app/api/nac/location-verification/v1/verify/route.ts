import { NextResponse } from "next/server";
import { simulateLocationVerify } from "@/lib/smart-guard/nac-simulator";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    device?: { phoneNumber?: string };
    area?: { areaType?: string; center?: { latitude: number; longitude: number }; radius?: number };
  };
  const email = request.headers.get("x-merchant-email") || "";
  const phoneNumber = String(body.device?.phoneNumber || "");
  const center = body.area?.center;
  if (!phoneNumber || center?.latitude == null || center?.longitude == null) {
    return NextResponse.json({ error: "device.phoneNumber and area.center are required" }, { status: 400 });
  }
  return NextResponse.json(
    await simulateLocationVerify(
      {
        device: { phoneNumber },
        area: {
          areaType: "CIRCLE",
          center: { latitude: center.latitude, longitude: center.longitude },
          radius: Number(body.area?.radius) || 2000,
        },
      },
      email,
    ),
  );
}
