import { NextResponse } from "next/server";
import { simulateSimSwapDate } from "@/lib/smart-guard/nac-simulator";

export async function POST(request: Request) {
  const body = (await request.json()) as { phoneNumber?: string };
  const email = request.headers.get("x-merchant-email") || "";
  const phoneNumber = String(body.phoneNumber || "");
  if (!phoneNumber) return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
  return NextResponse.json(await simulateSimSwapDate({ phoneNumber }, email));
}
