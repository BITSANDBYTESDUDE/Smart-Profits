import { NextResponse } from "next/server";
import { SENSITIVE_ACTIONS, type SensitiveAction } from "@/lib/smart-guard/types";
import { verifyNetworkChallenge } from "@/lib/smart-guard/network-code";
import { markStepUpVerified } from "@/lib/smart-guard/demo";
import { runSmartGuard } from "@/lib/smart-guard/run";
import { requestMeta } from "@/lib/server/request-meta";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      email?: string;
      phone?: string;
      code?: string;
    };
    const action = (body.action as SensitiveAction) || "login";
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").replace(/\s/g, "");
    if (!email || !SENSITIVE_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "email is required." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "mismatch" }, { status: 400 });
    }

    const check = verifyNetworkChallenge(email, code);
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, remaining: "remaining" in check ? check.remaining : undefined },
        { status: 403 },
      );
    }

    markStepUpVerified(email);
    const verdict = await runSmartGuard({
      action,
      email,
      phone: body.phone,
      meta: requestMeta(request),
    });
    return NextResponse.json({ ok: true, verdict });
  } catch {
    return NextResponse.json({ error: "Network code verification failed." }, { status: 500 });
  }
}
