import { NextResponse } from "next/server";
import { loadWorkspace, saveWorkspace } from "@/lib/server/workspaces";
import type { PersistedWorkspace } from "@/lib/serialize";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "البريد مطلوب." }, { status: 400 });
  }
  const workspace = await loadWorkspace(email);
  return NextResponse.json({ workspace });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; workspace?: PersistedWorkspace };
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@") || !body.workspace?.files) {
      return NextResponse.json({ error: "بيانات غير مكتملة." }, { status: 400 });
    }
    await saveWorkspace(email, body.workspace);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ مساحة العمل." }, { status: 500 });
  }
}
