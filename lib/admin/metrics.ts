import { countEvents, readPlatformEvents } from "./track";
import type { DateRangeKey } from "./config";
import { rangeBounds } from "./config";
import type { AdminSnapshot, AdminUserRow } from "./types";

function mulberry(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daysBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

const DEMO_STORES = [
  ["نور العتيبي", "بيت النور"],
  ["خالد منصور", "متجر خالد للإلكترونيات"],
  ["سارة أحمد", "سارة بيوتي"],
  ["عمر الشريف", "بيت التاجر"],
  ["ليان حسن", "ليان هوم"],
  ["فهد الدوسري", "فهد ستور"],
  ["ميساء علي", "ميساء فاشن"],
  ["يوسف حمدي", "يوسف تك"],
  ["هدى سالم", "هدية"],
  ["بدر العلي", "بدر ماركت"],
];

function countWorkspaceFiles() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("smartprofit-workspace-v2");
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { files?: { isDemo?: boolean }[] };
    return (parsed.files ?? []).filter((file) => !file.isDemo).length;
  } catch {
    return 0;
  }
}

function readMerchantUsers(): AdminUserRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("smartprofit-users");
    if (!raw) return [];
    const filesUploaded = Math.max(1, countWorkspaceFiles());
    const parsed = JSON.parse(raw) as Array<{ fullName: string; storeName: string; email: string }>;
    return parsed.map((user, index) => ({
      id: `real-${user.email}`,
      name: user.fullName,
      store: user.storeName,
      email: user.email,
      registeredAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
      status: "active" as const,
      plan: "pro" as const,
      filesUploaded,
      lastActive: new Date().toISOString(),
      real: true,
    }));
  } catch {
    return [];
  }
}

function readOverrides(): Record<string, Partial<AdminUserRow>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("smartprofit-admin-user-overrides") ?? "{}") as Record<
      string,
      Partial<AdminUserRow>
    >;
  } catch {
    return {};
  }
}

export function saveUserOverride(id: string, patch: Partial<AdminUserRow>) {
  const current = readOverrides();
  current[id] = { ...current[id], ...patch };
  localStorage.setItem("smartprofit-admin-user-overrides", JSON.stringify(current));
}

export function buildAdminSnapshot(range: DateRangeKey, from?: string, to?: string): AdminSnapshot {
  const { start, end } = rangeBounds(range, from, to);
  const days = daysBetween(start, end);
  const rand = mulberry(start.getFullYear() * 1000 + start.getMonth() * 40 + days);
  const scale = Math.max(1, days / 30);

  const visitors = Math.round(420 * days * (0.85 + rand() * 0.4));
  const visitorsChange = Math.round((rand() * 28 - 6) * 10) / 10;
  const activeUsers = Math.max(8, Math.round(38 * scale + rand() * 12));
  const mrr = Math.round(1860 + 420 * Math.min(scale, 4) + rand() * 200);
  const ai = Math.round(180 * scale + 40);
  const hosting = Math.round(90 * scale + 25);
  const payments = Math.round(mrr * 0.029 + 12);
  const marketing = Math.round(140 * scale + 30);
  const outflowTotal = ai + hosting + payments + marketing;
  const subscriptions = Math.round(mrr * Math.min(1, days / 30));
  const addons = Math.round(120 * scale);
  const inflowTotal = subscriptions + addons;
  const netProfit = inflowTotal - outflowTotal;

  const points = Math.min(days, range === "year" ? 12 : range === "today" ? 8 : 10);
  const revenueSeries = Array.from({ length: points }, (_, index) => {
    const name =
      range === "year"
        ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"][index] ?? `${index + 1}`
        : range === "today"
          ? `${8 + index}:00`
          : `ي${index + 1}`;
    return {
      name,
      revenue: Math.round((inflowTotal / points) * (0.7 + rand() * 0.7)),
      expenses: Math.round((outflowTotal / points) * (0.7 + rand() * 0.6)),
    };
  });

  const userGrowth = revenueSeries.map((point, index) => ({
    name: point.name,
    users: Math.max(1, Math.round((2 + rand() * 6) * (index + 1) * 0.35)),
  }));

  const tracked = readPlatformEvents().filter((event) => event.at >= start.getTime() && event.at <= end.getTime());
  const activity = [
    ...tracked.slice(0, 6).map((event, index) => ({
      id: `t-${event.at}-${index}`,
      icon: event.type === "analyze" || event.type === "doctor" || event.type === "whatif" ? ("analyze" as const) : event.type === "register" ? ("user" as const) : ("pay" as const),
      text:
        event.type === "analyze"
          ? `تاجر أجرى تحليل Excel${event.label ? ` (${event.label})` : ""}`
          : event.type === "register"
            ? "مستخدم جديد سجّل حسابه"
            : event.type === "doctor"
              ? "تاجر فتح تشخيص طبيب المتجر"
              : event.type === "whatif"
                ? "محاكاة قرار What-If"
                : event.type === "upload_error"
                  ? "فشل رفع/تنظيف ملف Excel"
                  : "نشاط على المنصة",
      time: new Date(event.at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    })),
    {
      id: "seed-1",
      icon: "analyze" as const,
      text: "تاجر أجرى تحليل Excel منذ 3 دقائق",
      time: "الآن",
    },
    {
      id: "seed-2",
      icon: "pay" as const,
      text: "اشتراك جديد في الباقة الاحترافية — $49",
      time: "قبل 12 د",
    },
    {
      id: "seed-3",
      icon: "user" as const,
      text: "مستخدم جديد سجّل حسابه",
      time: "قبل 28 د",
    },
  ].slice(0, 8);

  const demoUsers: AdminUserRow[] = DEMO_STORES.map(([name, store], index) => ({
    id: `demo-${index}`,
    name,
    store,
    email: `${name.split(" ")[0].toLowerCase()}@shop.sa`,
    registeredAt: new Date(Date.now() - (index + 3) * 86400000 * 4).toISOString(),
    status: index % 7 === 0 ? "churned" : index % 5 === 0 ? "inactive" : "active",
    plan: index % 4 === 0 ? "business" : index % 3 === 0 ? "free" : "pro",
    filesUploaded: 1 + Math.round(rand() * 14),
    lastActive: new Date(Date.now() - index * 3600000 * 6).toISOString(),
    real: false,
  }));

  const overrides = readOverrides();
  const users = [...readMerchantUsers(), ...demoUsers].map((user) => ({ ...user, ...overrides[user.id] }));

  const free = users.filter((user) => user.plan === "free").length;
  const pro = users.filter((user) => user.plan === "pro").length;
  const business = users.filter((user) => user.plan === "business").length;
  const totalUsers = Math.max(1, users.length);
  const activeCount = users.filter((user) => user.status === "active").length;
  const churned = users.filter((user) => user.status === "churned").length;

  const transactions = users.slice(0, 10).map((user, index) => ({
    invoice: `INV-2026-${String(1040 + index).padStart(4, "0")}`,
    merchant: user.store,
    amount: user.plan === "business" ? 99 : user.plan === "pro" ? 49 : 0,
    status: index % 8 === 0 ? ("failed" as const) : index % 11 === 0 ? ("refunded" as const) : ("success" as const),
    date: new Date(Date.now() - index * 86400000 * 2).toISOString(),
    plan: user.plan === "business" ? "Business" : user.plan === "pro" ? "Pro" : "Free",
  }));

  const doctor = 86 * scale + countEvents("doctor", start, end);
  const whatif = 54 * scale + countEvents("whatif", start, end);
  const leak = 71 * scale + countEvents("leak", start, end);
  const uploadErrors = Math.round(4 * scale) + countEvents("upload_error", start, end);

  const uniqueVisitors = Math.round(visitors * 0.62);
  const pageViews = Math.round(visitors * 2.4);
  const conversion = Math.round((activeUsers / Math.max(1, uniqueVisitors)) * 1000) / 10;

  const alerts = [
    { id: "a1", tone: "success" as const, text: "مستخدم جديد اشترك في المنصة", time: "منذ 4 د" },
    ...(transactions.some((row) => row.status === "failed")
      ? [{ id: "a2", tone: "danger" as const, text: "فشل عملية دفع — راجع الخزينة", time: "منذ 18 د" }]
      : []),
    { id: "a3", tone: "warning" as const, text: "ارتفاع مفاجئ في حركة الزوار (+15%)", time: "اليوم" },
  ];

  return {
    visitors,
    visitorsChange,
    activeUsers,
    mrr,
    netProfit,
    revenueSeries,
    userGrowth,
    activity,
    inflow: { subscriptions, addons, total: inflowTotal },
    outflow: { ai, hosting, payments, marketing, total: outflowTotal },
    margin: Math.round((netProfit / Math.max(1, inflowTotal)) * 1000) / 10,
    arpu: Math.round((mrr / Math.max(1, activeUsers)) * 10) / 10,
    transactions,
    retention: Math.round((activeCount / totalUsers) * 1000) / 10,
    churn: Math.round((churned / totalUsers) * 1000) / 10,
    ltv: Math.round((mrr / Math.max(1, activeUsers)) * 11),
    planSplit: { free, pro, business },
    users,
    uniqueVisitors,
    pageViews,
    sources: [
      { name: "بحث Google", value: 46, color: "#10B981" },
      { name: "مباشر", value: 28, color: "#3B82F6" },
      { name: "شبكات التواصل", value: 18, color: "#8B5CF6" },
      { name: "تحويلات", value: 8, color: "#F59E0B" },
    ],
    countries: [
      { name: "السعودية", visitors: Math.round(uniqueVisitors * 0.48) },
      { name: "الإمارات", visitors: Math.round(uniqueVisitors * 0.16) },
      { name: "الأردن", visitors: Math.round(uniqueVisitors * 0.11) },
      { name: "مصر", visitors: Math.round(uniqueVisitors * 0.09) },
      { name: "أخرى", visitors: Math.round(uniqueVisitors * 0.16) },
    ],
    conversion,
    features: [
      { name: "Profit Leak Detector", uses: Math.round(leak) },
      { name: "What-If Simulator", uses: Math.round(whatif) },
      { name: "Business Doctor", uses: Math.round(doctor) },
      { name: "تنظيف Excel", uses: Math.round(120 * scale + countEvents("analyze", start, end)) },
    ],
    uploadErrors,
    alerts,
  };
}
