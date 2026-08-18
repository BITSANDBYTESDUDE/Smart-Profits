import { NextResponse } from "next/server";
import { SENSITIVE_ACTIONS, type SensitiveAction } from "@/lib/smart-guard/types";
import { decideSmartGuard } from "@/lib/smart-guard/policy";
import {
  decisionToGate,
  mockGateLabel,
  mockLocationVerify,
  mockNumberVerify,
  mockSimSwapCheck,
  mockSimSwapDate,
} from "@/lib/smart-guard/nokia-mock";
import { SIM_SWAP_MAX_AGE_HOURS } from "@/lib/smart-guard/nac-contract";

function hoursSince(iso: string | null | undefined) {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  return Math.max(0, (Date.now() - at) / 36e5);
}

/**
 * Unified hackathon mock: dummy Nokia inputs → مسموح / مرفوض / تحقق إضافي.
 * Smart Guard still makes the Allow / Step-up / Freeze call from the three CAMARA signals.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phoneNumber?: string;
      action?: string;
      email?: string;
    };
    const phoneNumber = String(body.phoneNumber || "").trim();
    const action = (body.action as SensitiveAction) || "file_upload";
    const email = String(body.email || request.headers.get("x-merchant-email") || "mock@smartprofits.local")
      .trim()
      .toLowerCase();
    if (!phoneNumber) {
      return NextResponse.json({ error: "phoneNumber is required." }, { status: 400 });
    }
    if (!SENSITIVE_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const [simCheck, simDate, number, location] = await Promise.all([
      mockSimSwapCheck({ phoneNumber, maxAge: SIM_SWAP_MAX_AGE_HOURS }, email),
      mockSimSwapDate({ phoneNumber }, email),
      mockNumberVerify({ phoneNumber }, email),
      mockLocationVerify(
        {
          device: { phoneNumber },
          area: {
            areaType: "CIRCLE",
            center: { latitude: 31.5017, longitude: 34.4668 },
            radius: 2000,
          },
        },
        email,
      ),
    ]);

    const hoursAgo = hoursSince(simDate.latestSimChange);
    const verdict = decideSmartGuard({
      action,
      nacMode: "simulator",
      simSwap: {
        swapped: Boolean(simCheck.swapped),
        hoursAgo,
        recent: Boolean(simCheck.swapped),
        latestSimChange: simDate.latestSimChange,
      },
      location: {
        match: location.verificationResult === "TRUE" ? true : location.verificationResult === "FALSE" ? false : null,
        reason: location.verificationResult === "TRUE" ? "inside_store_geofence" : "mock_location",
        verificationResult: location.verificationResult,
        lastLocationTime: location.lastLocationTime,
        matchRate: location.matchRate ?? null,
      },
      number: { verified: Boolean(number.devicePhoneNumberVerified) },
      merchant: {
        email,
        phone: phoneNumber,
        alreadyFrozen: false,
        stepUpVerified: false,
        accountAgeHours: 48,
        suspicious: false,
      },
    });

    const gate = decisionToGate(verdict.decision);
    return NextResponse.json({
      allowed: gate === "allow",
      gate,
      labelAr: mockGateLabel(gate, "ar"),
      labelEn: mockGateLabel(gate, "en"),
      decision: verdict.decision,
      reason: verdict.reason,
      summary: verdict.summary,
      nokia: {
        simSwap: simCheck,
        simSwapDate: simDate,
        numberVerification: number,
        locationVerification: location,
      },
    });
  } catch {
    return NextResponse.json({ error: "Nokia mock gate failed." }, { status: 500 });
  }
}
