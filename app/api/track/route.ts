import { NextResponse } from "next/server";
import { appendEvent } from "@/lib/server/events";
import type { TrackEvent } from "@/lib/admin/config";

export async function POST(request: Request) {
  try {
    const event = (await request.json()) as TrackEvent;
    if (!event?.type || !event.at) {
      return NextResponse.json({ error: "حدث غير صالح." }, { status: 400 });
    }
    await appendEvent({
      type: event.type,
      at: event.at,
      label: event.label,
      email: event.email?.toLowerCase(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الحدث." }, { status: 500 });
  }
}
