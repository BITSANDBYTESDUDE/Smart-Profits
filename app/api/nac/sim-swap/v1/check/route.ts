import { NextResponse } from "next/server";
import { SIM_SWAP_MAX_AGE_HOURS } from "@/lib/smart-guard/nac-contract";
import { simulateSimSwapCheck } from "@/lib/smart-guard/nac-simulator";

export async function POST(request: Request) {
  const body = (await request.json()) as { phoneNumber?: string; maxAge?: number };
  const email = request.headers.get("x-merchant-email") || "";
  const phoneNumber = String(body.phoneNumber || "");
  if (!phoneNumber) return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
  const result = await simulateSimSwapCheck(
    { phoneNumber, maxAge: Number(body.maxAge) || SIM_SWAP_MAX_AGE_HOURS },
    email,
  );
  return NextResponse.json(result);
}
