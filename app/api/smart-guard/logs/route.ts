import { NextResponse } from "next/server";
import { listGuardDecisions } from "@/lib/server/guard-log";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email") || "";
    const limit = Number(url.searchParams.get("limit") || 40);
    const result = await listGuardDecisions({ email: email || undefined, limit });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not read Smart Guard logs." }, { status: 500 });
  }
}
