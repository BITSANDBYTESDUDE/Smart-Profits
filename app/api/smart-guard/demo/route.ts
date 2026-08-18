import { NextResponse } from "next/server";
import { readDemoFlags, writeDemoFlags } from "@/lib/smart-guard/demo";
import { DEFAULT_NAC_DEMO } from "@/lib/smart-guard/types";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase() || "";
  if (!email) return NextResponse.json({ flags: DEFAULT_NAC_DEMO });
  const flags = await readDemoFlags(email);
  return NextResponse.json({ flags });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      simSwapRecent?: boolean;
      locationOutside?: boolean;
      numberMatch?: boolean;
    };
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "email is required." }, { status: 400 });
    const flags = await writeDemoFlags(email, {
      simSwapRecent: Boolean(body.simSwapRecent),
      locationOutside: Boolean(body.locationOutside),
      numberMatch: body.numberMatch !== false,
    });
    return NextResponse.json({ ok: true, flags });
  } catch {
    return NextResponse.json({ error: "Could not save simulator flags." }, { status: 500 });
  }
}
