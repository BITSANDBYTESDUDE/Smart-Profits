import { NextResponse } from "next/server";
import { findAccount } from "@/lib/server/accounts";
import { createNetworkChallenge } from "@/lib/smart-guard/network-code";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; phone?: string };
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "email is required." }, { status: 400 });
    }

    const account = await findAccount(email);
    const phone = String(body.phone || account?.phone || "").trim();
    if (!phone) {
      return NextResponse.json({ error: "missing_phone" }, { status: 400 });
    }

    const result = createNetworkChallenge(email, phone);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "cooldown",
          retryAfterSec: result.retryAfterSec,
          maskedPhone: result.maskedPhone,
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      ok: true,
      channel: result.channel,
      maskedPhone: result.maskedPhone,
      expiresInSec: result.expiresInSec,
      retryAfterSec: result.retryAfterSec,
      demoCode: result.demoCode,
    });
  } catch {
    return NextResponse.json({ error: "Could not send the network code." }, { status: 500 });
  }
}
