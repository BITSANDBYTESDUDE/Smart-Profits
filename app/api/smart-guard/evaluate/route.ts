import { NextResponse } from "next/server";
import { SENSITIVE_ACTIONS, type SensitiveAction } from "@/lib/smart-guard/types";
import { runSmartGuard } from "@/lib/smart-guard/run";
import { requestMeta } from "@/lib/server/request-meta";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      email?: string;
      phone?: string;
      coords?: { lat: number; lng: number } | null;
      fileBytes?: number;
      fileName?: string;
    };
    const action = body.action as SensitiveAction;
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !SENSITIVE_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "action and email are required." }, { status: 400 });
    }

    const verdict = await runSmartGuard({
      action,
      email,
      phone: body.phone,
      fileBytes: body.fileBytes,
      fileName: body.fileName,
      meta: requestMeta(request),
    });
    return NextResponse.json({ verdict });
  } catch {
    return NextResponse.json({ error: "Smart Guard could not evaluate this action." }, { status: 500 });
  }
}
