import { NextResponse } from "next/server";

/** One-click Number Verification is no longer a step-up. Merchants must confirm a network code. */
export async function POST() {
  return NextResponse.json(
    { error: "A network code is required. POST /api/smart-guard/step-up/send then /verify." },
    { status: 400 },
  );
}
