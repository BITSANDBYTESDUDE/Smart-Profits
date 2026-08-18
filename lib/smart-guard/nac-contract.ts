export const SIM_SWAP_MAX_AGE_HOURS = 24;
export const STORE_RADIUS_METERS = 2000;

export type NacMode = "simulator" | "live";

export function nacMode(): NacMode {
  return process.env.NAC_API_KEY ? "live" : "simulator";
}

export function nacBaseUrl() {
  return (process.env.NAC_BASE_URL || "https://network-as-code.p-eu.rapidapi.com").replace(/\/$/, "");
}

export function nacHeaders() {
  const key = process.env.NAC_API_KEY || "";
  const host = process.env.NAC_RAPIDAPI_HOST || "network-as-code.nokia.rapidapi.com";
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-RapidAPI-Key": key,
    "X-RapidAPI-Host": host,
  };
}

export interface CamaraSimSwapCheckRequest {
  phoneNumber: string;
  maxAge: number;
}

export interface CamaraSimSwapCheckResponse {
  swapped: boolean;
}

export interface CamaraSimSwapDateRequest {
  phoneNumber: string;
}

export interface CamaraSimSwapDateResponse {
  latestSimChange: string | null;
}

export interface CamaraNumberVerifyRequest {
  phoneNumber: string;
}

export interface CamaraNumberVerifyResponse {
  devicePhoneNumberVerified: boolean;
}

export interface CamaraLocationVerifyRequest {
  device: { phoneNumber: string };
  area: {
    areaType: "CIRCLE";
    center: { latitude: number; longitude: number };
    radius: number;
  };
}

export interface CamaraLocationVerifyResponse {
  verificationResult: "TRUE" | "FALSE" | "PARTIAL";
  lastLocationTime: string;
  matchRate?: number;
}

export interface NacCallTrace {
  api: "number-verification" | "sim-swap" | "location-verification";
  endpoint: string;
  mode: NacMode;
  request: unknown;
  response: unknown;
}
