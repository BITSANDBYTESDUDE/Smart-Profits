import { readDemoFlags } from "./demo";
import {
  SIM_SWAP_MAX_AGE_HOURS,
  type CamaraLocationVerifyRequest,
  type CamaraLocationVerifyResponse,
  type CamaraNumberVerifyRequest,
  type CamaraNumberVerifyResponse,
  type CamaraSimSwapCheckRequest,
  type CamaraSimSwapCheckResponse,
  type CamaraSimSwapDateRequest,
  type CamaraSimSwapDateResponse,
} from "./nac-contract";

export type MockGate = "allow" | "deny" | "step_up";

export interface NokiaMockProfile {
  phoneNumber: string;
  labelAr: string;
  labelEn: string;
  gate: MockGate;
  simSwap: boolean;
  simChangeHoursAgo: number;
  numberVerified: boolean;
  location: "TRUE" | "FALSE" | "PARTIAL";
  matchRate: number;
}

/**
 * Dummy Nokia NaC numbers for the hackathon mock server.
 * +99999991000 / 1001 match the Nokia sandbox. +99999991002 is a mild Step-up case.
 */
export const NOKIA_MOCK_PROFILES: NokiaMockProfile[] = [
  {
    phoneNumber: "+99999991000",
    labelAr: "مرفوض — تبديل شريحة + موقع بعيد",
    labelEn: "Denied — SIM swap + far location",
    gate: "deny",
    simSwap: true,
    simChangeHoursAgo: 3,
    numberVerified: false,
    location: "FALSE",
    matchRate: 12,
  },
  {
    phoneNumber: "+99999991001",
    labelAr: "مسموح — إشارات سليمة",
    labelEn: "Allowed — clean signals",
    gate: "allow",
    simSwap: false,
    simChangeHoursAgo: 720,
    numberVerified: true,
    location: "TRUE",
    matchRate: 94,
  },
  {
    phoneNumber: "+99999991002",
    labelAr: "تحقق إضافي — موقع غير مطابق قليلاً",
    labelEn: "Step-up — slight location mismatch",
    gate: "step_up",
    simSwap: false,
    simChangeHoursAgo: 400,
    numberVerified: true,
    location: "PARTIAL",
    matchRate: 58,
  },
];

function hoursAgoIso(hours: number) {
  return new Date(Date.now() - hours * 36e5).toISOString();
}

export function findNokiaMockProfile(phoneNumber: string) {
  return NOKIA_MOCK_PROFILES.find((row) => row.phoneNumber === phoneNumber) ?? null;
}

export async function mockSimSwapCheck(
  body: CamaraSimSwapCheckRequest,
  email: string,
): Promise<CamaraSimSwapCheckResponse> {
  const profile = findNokiaMockProfile(body.phoneNumber);
  const maxAge = body.maxAge || SIM_SWAP_MAX_AGE_HOURS;
  if (profile) return { swapped: profile.simSwap && maxAge >= 1 };
  const demo = await readDemoFlags(email);
  return { swapped: Boolean(demo.simSwapRecent) && maxAge >= 1 };
}

export async function mockSimSwapDate(
  body: CamaraSimSwapDateRequest,
  email: string,
): Promise<CamaraSimSwapDateResponse> {
  const profile = findNokiaMockProfile(body.phoneNumber);
  if (profile) return { latestSimChange: hoursAgoIso(profile.simChangeHoursAgo) };
  const demo = await readDemoFlags(email);
  if (demo.simSwapRecent) return { latestSimChange: hoursAgoIso(6) };
  return { latestSimChange: hoursAgoIso(400) };
}

export async function mockNumberVerify(
  body: CamaraNumberVerifyRequest,
  email: string,
): Promise<CamaraNumberVerifyResponse> {
  const profile = findNokiaMockProfile(body.phoneNumber);
  if (profile) return { devicePhoneNumberVerified: profile.numberVerified };
  const demo = await readDemoFlags(email);
  return { devicePhoneNumberVerified: demo.numberMatch !== false };
}

export async function mockLocationVerify(
  body: CamaraLocationVerifyRequest,
  email: string,
): Promise<CamaraLocationVerifyResponse> {
  const now = new Date().toISOString();
  const profile = findNokiaMockProfile(body.device.phoneNumber);
  if (profile) {
    return { verificationResult: profile.location, lastLocationTime: now, matchRate: profile.matchRate };
  }
  const demo = await readDemoFlags(email);
  if (demo.locationOutside) {
    return { verificationResult: "PARTIAL", lastLocationTime: now, matchRate: 58 };
  }
  return { verificationResult: "TRUE", lastLocationTime: now, matchRate: 91 };
}

export function mockGateLabel(gate: MockGate, locale: "ar" | "en" = "ar") {
  if (gate === "allow") return locale === "ar" ? "مسموح" : "Allowed";
  if (gate === "deny") return locale === "ar" ? "مرفوض" : "Denied";
  return locale === "ar" ? "تحقق إضافي" : "Step-up";
}

export function decisionToGate(decision: "allow" | "step_up" | "freeze"): MockGate {
  if (decision === "freeze") return "deny";
  if (decision === "step_up") return "step_up";
  return "allow";
}
