import { buildAdvisorReport } from "./advisor";
import { monthKey, monthLabel } from "./format";
import { predictFuturePerformance } from "./forecast";
import { monthlyOpexFromSettings } from "./opex";
import { clamp, round2, safeDivide } from "./utils";
import type {
  AnalysisResult,
  AppSettings,
  ExpenseSlice,
  FinancialKPIs,
  MonthlyPoint,
  ParseResult,
  ProductStat,
  StagnantItem,
  Transaction,
  ProductHighlights,
  ProductPerformance,
} from "./types";

const SLICE_COLORS = ["#10B981", "#3B82F6", "#64748B", "#8B5CF6", "#F59E0B", "#EF4444"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthOf(date: Date) {
  return { year: date.getFullYear(), month: date.getMonth() };
}

export { monthlyOpexFromSettings };

export function buildMonthlySeries(
  transactions: Transaction[],
  settings: AppSettings,
): MonthlyPoint[] {
  const buckets = new Map<string, MonthlyPoint>();
  const dated = transactions.filter((t) => t.date);

  const source = dated.length ? dated : transactions;
  const fallback = new Date();

  for (const tx of source) {
    const date = tx.date ?? fallback;
    const { year, month } = monthOf(date);
    const key = monthKey(year, month);
    const current = buckets.get(key) ?? {
      key,
      label: monthLabel(year, month),
      year,
      month,
      revenue: 0,
      cogs: 0,
      opex: 0,
      expenses: 0,
      netProfit: 0,
    };

    current.revenue += tx.revenue;
    current.cogs += tx.costPrice * (tx.quantity || 1);
    current.opex += tx.expense;
    buckets.set(key, current);
  }

  const monthlyFixed = monthlyOpexFromSettings(settings);
  const points = Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));

  for (const point of points) {
    point.opex += monthlyFixed;
    point.expenses = point.cogs + point.opex;
    point.netProfit = point.revenue - point.expenses;
  }

  return points;
}

function latestTwo(points: MonthlyPoint[]) {
  if (points.length === 0) return { current: null as MonthlyPoint | null, previous: null as MonthlyPoint | null };
  if (points.length === 1) return { current: points[0], previous: null };
  return { current: points[points.length - 1], previous: points[points.length - 2] };
}

function changePct(current: number, previous: number | undefined) {
  if (previous == null || previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function computeHealthScore(input: {
  profitMargin: number;
  revenueChangePct: number;
  expenseChangePct: number;
  predictedProfit: number;
  currentProfit: number;
}) {
  const marginScore = clamp((input.profitMargin / 35) * 40, 0, 40);
  const trendScore =
    input.revenueChangePct >= 8 ? 25 : input.revenueChangePct >= 0 ? 18 : clamp(12 + input.revenueChangePct, 0, 12);
  const expenseControl =
    input.expenseChangePct <= input.revenueChangePct ? 20 : clamp(20 - (input.expenseChangePct - input.revenueChangePct), 0, 20);
  const forecastScore = input.predictedProfit > 0 ? 15 : input.currentProfit > 0 ? 6 : 0;
  const score = Math.round(clamp(marginScore + trendScore + expenseControl + forecastScore, 0, 100));

  const healthLabel =
    score >= 85 ? "ممتاز" : score >= 70 ? "جيد جداً" : score >= 50 ? "متوسط" : score >= 30 ? "ضعيف" : "حرج";

  return { healthScore: score, healthLabel };
}

export function computeKpis(
  monthly: MonthlyPoint[],
  predictedProfit: number,
): FinancialKPIs {
  const { current, previous } = latestTwo(monthly);
  const totalRevenue = current?.revenue ?? 0;
  const totalCogs = current?.cogs ?? 0;
  const totalOpex = current?.opex ?? 0;
  const totalExpenses = current?.expenses ?? 0;
  const netProfit = current?.netProfit ?? 0;
  const profitMargin = safeDivide(netProfit, totalRevenue) * 100;
  const revenueChangePct = changePct(totalRevenue, previous?.revenue);
  const expenseChangePct = changePct(totalExpenses, previous?.expenses);
  const profitChangePct = changePct(netProfit, previous?.netProfit);
  const { healthScore, healthLabel } = computeHealthScore({
    profitMargin,
    revenueChangePct,
    expenseChangePct,
    predictedProfit,
    currentProfit: netProfit,
  });

  return {
    totalRevenue: round2(totalRevenue),
    totalCogs: round2(totalCogs),
    totalOpex: round2(totalOpex),
    totalExpenses: round2(totalExpenses),
    netProfit: round2(netProfit),
    profitMargin: round2(profitMargin),
    healthScore,
    healthLabel,
    revenueChangePct: round2(revenueChangePct),
    expenseChangePct: round2(expenseChangePct),
    profitChangePct: round2(profitChangePct),
  };
}

export function expenseBreakdown(
  current: MonthlyPoint | null | undefined,
  settings: AppSettings,
): ExpenseSlice[] {
  if (!current) return [];
  const fixed = monthlyOpexFromSettings(settings);
  const fileVariable = Math.max(0, current.opex - fixed);
  const slices: ExpenseSlice[] = [
    { name: "المخزون / التكلفة", value: current.cogs, color: SLICE_COLORS[0] },
    { name: "الإيجار", value: settings.opexIncludedInFile ? 0 : settings.rent, color: SLICE_COLORS[1] },
    { name: "الرواتب", value: settings.opexIncludedInFile ? 0 : settings.salaries, color: SLICE_COLORS[2] },
    { name: "فواتير وخدمات", value: settings.opexIncludedInFile ? 0 : settings.utilities || 0, color: SLICE_COLORS[4] },
    { name: "تسويق واشتراكات", value: settings.opexIncludedInFile ? 0 : settings.otherOpex, color: SLICE_COLORS[3] },
    { name: "تشغيل من الملف", value: fileVariable, color: SLICE_COLORS[5] },
  ].filter((s) => s.value > 0);

  return slices.map((slice, index) => ({ ...slice, color: SLICE_COLORS[index % SLICE_COLORS.length] }));
}

function productStatus(recent: number, older: number): ProductStat["status"] {
  if (older === 0) return recent > 0 ? "rising" : "stable";
  const change = (recent - older) / Math.abs(older);
  if (change >= 0.08) return "rising";
  if (change <= -0.08) return "declining";
  return "stable";
}

export function computeProductStats(transactions: Transaction[]): ProductStat[] {
  const map = new Map<
    string,
    { revenue: number; quantity: number; lastSale: Date | null; recent: number; older: number }
  >();

  const dated = transactions.filter((t) => t.date).sort((a, b) => a.date!.getTime() - b.date!.getTime());
  const maxTime = dated.length ? dated[dated.length - 1].date!.getTime() : Date.now();
  const split = maxTime - 30 * 86400000;

  for (const tx of transactions) {
    if (!tx.product || tx.revenue <= 0) continue;
    const current = map.get(tx.product) ?? {
      revenue: 0,
      quantity: 0,
      lastSale: null as Date | null,
      recent: 0,
      older: 0,
    };
    current.revenue += tx.revenue;
    current.quantity += tx.quantity || 0;
    if (tx.date && (!current.lastSale || tx.date > current.lastSale)) current.lastSale = tx.date;
    if (tx.date && tx.date.getTime() >= split) current.recent += tx.revenue;
    else current.older += tx.revenue;
    map.set(tx.product, current);
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({
      name,
      revenue: round2(value.revenue),
      quantity: value.quantity,
      lastSale: value.lastSale ? value.lastSale.toISOString() : null,
      status: productStatus(value.recent, value.older),
      changePct: round2(changePct(value.recent, value.older)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
}

export function computeStagnantInventory(transactions: Transaction[]): StagnantItem[] {
  const map = new Map<string, { lastSale: Date | null; revenue: number }>();
  let maxDate: Date | null = null;

  for (const tx of transactions) {
    if (!tx.product || tx.revenue <= 0) continue;
    const current = map.get(tx.product) ?? { lastSale: null as Date | null, revenue: 0 };
    current.revenue += tx.revenue;
    if (tx.date && (!current.lastSale || tx.date > current.lastSale)) current.lastSale = tx.date;
    if (tx.date && (!maxDate || tx.date > maxDate)) maxDate = tx.date;
    map.set(tx.product, current);
  }

  const reference = maxDate ?? new Date();
  return Array.from(map.entries())
    .map(([name, value]) => {
      const last = value.lastSale ? startOfDay(value.lastSale) : startOfDay(new Date(0));
      const daysStagnant = Math.max(
        0,
        Math.round((startOfDay(reference).getTime() - last.getTime()) / 86400000),
      );
      return {
        name,
        daysStagnant,
        lastRevenue: round2(value.revenue),
        suggestedAction:
          daysStagnant >= 90 ? ("liquidate" as const) : daysStagnant >= 60 ? ("discount20" as const) : ("review" as const),
      };
    })
    .filter((item) => item.daysStagnant >= 45)
    .sort((a, b) => b.daysStagnant - a.daysStagnant)
    .slice(0, 6);
}

export function computeProductHighlights(transactions: Transaction[]): ProductHighlights {
  const map = new Map<
    string,
    { saleCount: number; quantity: number; revenue: number; cogs: number }
  >();

  for (const tx of transactions) {
    if (!tx.product || tx.revenue <= 0) continue;
    if (/شحن|تسويق|shipping|delivery/i.test(`${tx.product} ${tx.category}`)) continue;
    const current = map.get(tx.product) ?? { saleCount: 0, quantity: 0, revenue: 0, cogs: 0 };
    current.saleCount += 1;
    current.quantity += tx.quantity || 0;
    current.revenue += tx.revenue;
    current.cogs += tx.costPrice * (tx.quantity || 1);
    map.set(tx.product, current);
  }

  const catalog: ProductPerformance[] = Array.from(map.entries())
    .map(([name, value]) => {
      const profit = round2(value.revenue - value.cogs);
      return {
        name,
        saleCount: value.saleCount,
        quantity: value.quantity,
        revenue: round2(value.revenue),
        cogs: round2(value.cogs),
        profit,
        margin: round2(safeDivide(profit, value.revenue) * 100),
        isLoss: profit < 0,
      };
    })
    .sort((a, b) => b.quantity - a.quantity || b.saleCount - a.saleCount);

  const highestSales = catalog[0] ?? null;
  const lowestSales =
    catalog.length > 0
      ? [...catalog].sort((a, b) => a.saleCount - b.saleCount || a.quantity - b.quantity)[0]
      : null;
  const mostProfitable =
    catalog.length > 0 ? [...catalog].sort((a, b) => b.profit - a.profit)[0] : null;
  const minSales = lowestSales?.saleCount ?? 1;
  const lossMakers = catalog
    .filter((item) => item.isLoss || (item.saleCount <= Math.max(1, minSales) && item.profit <= 0))
    .sort((a, b) => a.profit - b.profit);

  return { catalog, highestSales, lowestSales, mostProfitable, lossMakers };
}

export function runFullAnalysis(parsed: ParseResult, settings: AppSettings): AnalysisResult {
  const monthlySeries = buildMonthlySeries(parsed.transactions, settings);
  const forecast = predictFuturePerformance(monthlySeries);
  const kpis = computeKpis(monthlySeries, forecast.nextMonthProfit);
  const { current } = latestTwo(monthlySeries);

  const productHighlights = computeProductHighlights(parsed.transactions);
  const stagnantInventory = computeStagnantInventory(parsed.transactions);
  const extraInsight = buildShippingInsight(parsed.transactions);
  if (extraInsight) {
    forecast.alerts = [extraInsight, ...forecast.alerts.filter((a) => a.id !== extraInsight.id)];
  }

  const advisor = buildAdvisorReport({
    transactions: parsed.transactions,
    kpis,
    monthly: monthlySeries,
    forecast,
    highlights: productHighlights,
    stagnant: stagnantInventory,
    settings,
    reviewNeeded: parsed.cleaning?.reviewNeeded ?? 0,
  });

  return {
    kpis,
    monthlySeries,
    expenseBreakdown: expenseBreakdown(current ?? undefined, settings),
    topProducts: computeProductStats(parsed.transactions),
    stagnantInventory,
    productHighlights,
    forecast,
    advisor,
    mapping: parsed.mapping,
    warnings: [...parsed.warnings, ...parsed.mapping.warnings.filter((w, i, arr) => arr.indexOf(w) === i)].filter(
      (warning, index, arr) => {
        if (arr.indexOf(warning) !== index) return false;
        const hasDates = parsed.transactions.some((tx) => tx.date);
        if (hasDates && warning.includes("عمود تاريخ")) return false;
        return true;
      },
    ),
    fileName: parsed.fileName,
    rowCount: parsed.rowCount,
    analyzedAt: new Date().toISOString(),
  };
}

function buildShippingInsight(transactions: Transaction[]) {
  const shipping = transactions.filter((t) =>
    /شحن|shipping|توصيل|delivery/i.test(`${t.category} ${t.expenseType} ${t.product}`),
  );
  if (shipping.length === 0) return null;

  const byMonth = new Map<string, number>();
  for (const tx of shipping) {
    if (!tx.date) continue;
    const key = monthKey(tx.date.getFullYear(), tx.date.getMonth());
    byMonth.set(key, (byMonth.get(key) ?? 0) + (tx.expense || tx.revenue));
  }
  const keys = Array.from(byMonth.keys()).sort();
  if (keys.length < 2) return null;
  const prev = byMonth.get(keys[keys.length - 2]) ?? 0;
  const curr = byMonth.get(keys[keys.length - 1]) ?? 0;
  if (prev === 0) return null;
  const change = ((curr - prev) / prev) * 100;
  if (change < 10) return null;

  return {
    id: "shipping-spike",
    severity: "medium" as const,
    title: "محلل النظام الاصطناعي",
    message: `لاحظنا ارتفاع تكاليف الشحن بنسبة ${change.toFixed(0)}% مقارنة بالفترة السابقة. نوصي بمراجعة عقود المورّدين للحفاظ على هامش الربح.`,
    recommendation: "قارن أسعار 3 مزودي شحن وأعد التفاوض على الشرائح الحجمية.",
  };
}
