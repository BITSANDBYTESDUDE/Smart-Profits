import { formatMoney } from "./format";
import type { Locale } from "./i18n";
import type { AnalysisResult, CurrencyCode, ProductPerformance } from "./types";

function norm(q: string) {
  return q
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[؟?!,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isEnglishQuestion(q: string) {
  const latin = (q.match(/[a-z]/gi) ?? []).length;
  const arabic = (q.match(/[\u0600-\u06FF]/g) ?? []).length;
  return latin > arabic;
}

function money(value: number, currency: CurrencyCode) {
  return formatMoney(value, currency);
}

function productLine(item: ProductPerformance, currency: CurrencyCode, en: boolean) {
  if (en) {
    return `«${item.name}» — profit ${money(item.profit, currency)}, margin ${item.margin.toFixed(0)}%, sales ${money(item.revenue, currency)}`;
  }
  return `«${item.name}» — ربح ${money(item.profit, currency)}، هامش ${item.margin.toFixed(0)}%، مبيعات ${money(item.revenue, currency)}`;
}

function findProduct(q: string, catalog: ProductPerformance[]) {
  const sorted = [...catalog].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((item) => {
    const name = norm(item.name);
    return name.length >= 2 && q.includes(name);
  });
}

function topN(q: string) {
  const match = q.match(/\b(\d{1,2})\b/) || q.match(/(?:اول|أول|top)\s*(\d{1,2})/);
  if (!match) return 3;
  return Math.min(10, Math.max(1, Number(match[1]) || 3));
}

export function answerMerchantQuestion(
  question: string,
  result: AnalysisResult,
  options?: { locale?: Locale; currency?: CurrencyCode },
): string {
  const q = norm(question);
  const currency = options?.currency ?? "SAR";
  const en = options?.locale === "en" || (options?.locale !== "ar" && isEnglishQuestion(question));
  const { kpis, advisor, productHighlights, forecast, fileName, rowCount } = result;
  const catalog = productHighlights.catalog;
  const leak = advisor.leaks[0];
  const health = advisor.health;
  const action = advisor.todayActions[0];
  const topProfit = productHighlights.mostProfitable;
  const topSales = productHighlights.highestSales;
  const worst = productHighlights.lossMakers[0] ?? productHighlights.lowestSales;

  if (!q) {
    return en
      ? "Ask about the open file, for example: highest profit product."
      : "اكتب سؤالك، مثلاً: مين أعلى منتج ربح؟";
  }

  const aboutProfitProduct =
    /(اعلا|اعلى|اعلي|افضل|احسن|رابح|ربح|highest|most profitable|top profit|best profit|biggest profit)/.test(q) &&
    /(منتج|صنف|سلعه|product|item|sku)/.test(q);
  const aboutProfitOnly =
    /(اعلا|اعلى|اعلي|افضل|احسن|highest|most profitable|top profit|best profit)/.test(q) &&
    /(ربح|profit)/.test(q);
  if ((aboutProfitProduct || aboutProfitOnly || /مين.*(ربح|رابح)/.test(q)) && !/خس|loss|worst|اقل|أقل/.test(q)) {
    if (!topProfit) {
      return en
        ? `No profitable products were found in «${fileName}».`
        : `ما ظهر منتج رابح واضح في «${fileName}».`;
    }
    const extra = [...catalog].sort((a, b) => b.profit - a.profit).slice(0, 3);
    if (en) {
      return `From the open file «${fileName}», the highest-profit product is ${productLine(topProfit, currency, true)}. Top 3:\n${extra.map((item, i) => `${i + 1}) ${productLine(item, currency, true)}`).join("\n")}`;
    }
    return `من الملف المفتوح «${fileName}»، الأعلى ربحاً هو ${productLine(topProfit, currency, false)}. أعلى 3:\n${extra.map((item, i) => `${i + 1}) ${productLine(item, currency, false)}`).join("\n")}`;
  }

  if (/(اعلا|اعلى|افضل|احسن|اكثر|أكثر|best seller|top seller|most sold|highest sales|أكثر مبيع|اعلى مبيع|اكثر مبيع)/.test(q)) {
    if (!topSales) {
      return en ? `No sales ranking in «${fileName}».` : `ما في ترتيب مبيعات واضح في «${fileName}».`;
    }
    const n = topN(q);
    const extra = [...catalog].sort((a, b) => b.revenue - a.revenue).slice(0, n);
    if (en) {
      return `Best seller in «${fileName}»: «${topSales.name}» with ${money(topSales.revenue, currency)} sales and ${topSales.quantity} units.\n${extra.map((item, i) => `${i + 1}) ${item.name} — ${money(item.revenue, currency)}`).join("\n")}`;
    }
    return `الأعلى مبيعاً في «${fileName}»: «${topSales.name}» بمبيعات ${money(topSales.revenue, currency)} وكمية ${topSales.quantity}.\n${extra.map((item, i) => `${i + 1}) ${item.name} — ${money(item.revenue, currency)}`).join("\n")}`;
  }

  if (/(خس|خاسر|اسوا|أسوأ|اقل ربح|أقل ربح|worst|loss.?mak|least profit|lowest)/.test(q)) {
    if (!worst) {
      return en ? "No losing products showed up in this file." : "ما ظهر منتج خاسر واضح في هذا الملف.";
    }
    const losers = [...catalog].sort((a, b) => a.profit - b.profit).slice(0, 3);
    if (en) {
      return `Weakest product in «${fileName}»: ${productLine(worst, currency, true)}. Lowest 3:\n${losers.map((item, i) => `${i + 1}) ${productLine(item, currency, true)}`).join("\n")}`;
    }
    return `أضعف منتج في «${fileName}»: ${productLine(worst, currency, false)}. أقل 3:\n${losers.map((item, i) => `${i + 1}) ${productLine(item, currency, false)}`).join("\n")}`;
  }

  if (/(list|قائمه|قائمة|كل المنتجات|all products|catalog|اعرض المنتجات)/.test(q)) {
    const n = Math.min(8, Math.max(3, topN(q)));
    const extra = [...catalog].sort((a, b) => b.profit - a.profit).slice(0, n);
    if (!extra.length) return en ? "No products in the open file." : "ما في منتجات في الملف المفتوح.";
    if (en) {
      return `Products in «${fileName}» (by profit):\n${extra.map((item, i) => `${i + 1}) ${productLine(item, currency, true)}`).join("\n")}`;
    }
    return `منتجات «${fileName}» حسب الربح:\n${extra.map((item, i) => `${i + 1}) ${productLine(item, currency, false)}`).join("\n")}`;
  }

  if (/(ليش|لماذا|سبب|why|drop|نزل|هبط)/.test(q) && /(ربح|خس|profit|loss)/.test(q)) {
    const costNote = kpis.expenseChangePct > kpis.revenueChangePct
      ? en
        ? `The main reason is costs/expenses up ${kpis.expenseChangePct.toFixed(0)}%, while sales ${kpis.revenueChangePct >= 0 ? "rose" : "fell"} ${Math.abs(kpis.revenueChangePct).toFixed(0)}%.`
        : `السبب الرئيسي هو ارتفاع التكلفة/المصاريف بنسبة ${kpis.expenseChangePct.toFixed(0)}%، بينما المبيعات ${kpis.revenueChangePct >= 0 ? "زادت" : "نزلت"} ${Math.abs(kpis.revenueChangePct).toFixed(0)}% فقط.`
      : en
        ? `Profit margin is now ${kpis.profitMargin.toFixed(1)}%. Check low-margin products first.`
        : `هامش الربح حالياً ${kpis.profitMargin.toFixed(1)}%. راجع المنتجات ضعيفة الهامش أولاً.`;
    const leakNote = leak
      ? en
        ? ` Biggest leak: «${leak.product}» — ${leak.issue}`
        : ` وأكبر تسريب ظاهر: «${leak.product}» — ${leak.issue}`
      : "";
    return `${costNote}${leakNote}`;
  }

  if (/(اشتري|اطلب|مخزون|ينفد|نفاد|inventory|stock|reorder|buy first|what should i buy)/.test(q)) {
    const order = advisor.inventory.find((item) => item.decision === "order_now");
    const stop = advisor.inventory.find((item) => item.decision === "dont_buy");
    if (order) {
      return en
        ? `Buy first: «${order.product}». ${order.reason}`
        : `الأولوية للشراء: «${order.product}». ${order.reason}`;
    }
    if (stop) {
      return en
        ? `Do not buy «${stop.product}» now. ${stop.reason}`
        : `لا تشترِ «${stop.product}» الآن. ${stop.reason}`;
    }
    return en
      ? "No urgent stock-out signal in this file. Focus on the fastest-profit products."
      : "ما في إشارة نفاد وشيكة من الملف. ركّز على المنتجات الأسرع ربحاً فقط.";
  }

  if (/(تسريب|هامش ضعيف|leak|margin)/.test(q) || (/(سعر|price)/.test(q) && /(منتج|product)/.test(q))) {
    if (!leak) {
      return en ? "No clear profit leak in this file." : "ما ظهر تسريب واضح في الربح من هذا الملف.";
    }
    return en
      ? `Leak in «${leak.product}»: sales ${money(leak.revenue, currency)} vs profit ${money(leak.profit, currency)}. ${leak.suggestion}`
      : `وجدنا تسريباً في «${leak.product}»: مبيعات ${money(leak.revenue, currency)} مقابل ربح ${money(leak.profit, currency)}. ${leak.suggestion}`;
  }

  if (/(صحه|صحه المتجر|تشخيص|health|how is the store|كيف المتجر)/.test(q)) {
    return en
      ? `Store health ${health.score}/100 (${health.label}). ${health.headline} ${health.findings[0]?.detail ?? ""}`
      : `صحة المتجر ${health.score}/100 (${health.label}). ${health.headline} ${health.findings[0]?.detail ?? ""}`;
  }

  if (/(اليوم|ماذا افعل|شو اعمل|قرار|today|what should i do|action)/.test(q)) {
    if (!action) {
      return en ? "Upload a clearer file so I can suggest today's action." : "ارفع ملفاً أوضح حتى نقترح قرار اليوم.";
    }
    return en ? `Today's action: ${action.title}. ${action.reason}` : `قرار اليوم: ${action.title}. ${action.reason}`;
  }

  if (/(شحن|توصيل|shipping|delivery)/.test(q)) {
    const shipping = result.expenseBreakdown.find((item) => /شحن|توصيل|shipping|delivery/i.test(item.name));
    if (shipping) {
      return en
        ? `Shipping/delivery from the file is ${money(shipping.value, currency)}. It is treated as operating cost and subtracted from sales for net profit.`
        : `تكلفة الشحن/التوصيل ظهرت من الملف (${money(shipping.value, currency)}). تُضاف إلى مصاريف التشغيل وتُطرح من المبيعات عند حساب صافي الربح.`;
    }
    return en
      ? "No clear shipping line in the open file. If an expense column contains shipping or delivery, it is counted automatically."
      : "ما ظهر بند شحن واضح في الملف. إن وُجد عمود مصروف فيه كلمة شحن أو توصيل، يُحسب تلقائياً ضمن التشغيل.";
  }

  if (/(صافي الربح|net profit|كيف يحسب|how.*(profit|calculated)|كيف تم حساب)/.test(q)) {
    return en
      ? `Net profit = sales − (cost of goods + operating costs like rent, salaries, shipping). Current margin ${kpis.profitMargin.toFixed(1)}%. In «${fileName}» net profit is ${money(kpis.netProfit, currency)}.`
      : `صافي الربح = المبيعات − (تكلفة البضاعة + المصاريف التشغيلية مثل الإيجار والرواتب والشحن). حالياً الهامش ${kpis.profitMargin.toFixed(1)}%. في «${fileName}» صافي الربح ${money(kpis.netProfit, currency)}.`;
  }

  if (/(توقع|شهر جاي|القادم|forecast|next month)/.test(q)) {
    const s = advisor.scenarios;
    return en
      ? `Next month — worst ${money(s.worst.profit, currency)}, expected ${money(s.expected.profit, currency)}, best ${money(s.best.profit, currency)}.`
      : `الشهر القادم — أسوأ حالة ربح ${money(s.worst.profit, currency)}، المتوقع ${money(s.expected.profit, currency)}، وأفضل حالة ${money(s.best.profit, currency)}.`;
  }

  if (/(مبيعات|ايراد|إيراد|revenue|sales total|كم بعنا)/.test(q) && !/(منتج|product)/.test(q)) {
    return en
      ? `In «${fileName}»: sales ${money(kpis.totalRevenue, currency)}, COGS ${money(kpis.totalCogs, currency)}, opex ${money(kpis.totalOpex, currency)}, net profit ${money(kpis.netProfit, currency)} (${kpis.profitMargin.toFixed(1)}%).`
      : `في «${fileName}»: المبيعات ${money(kpis.totalRevenue, currency)}، تكلفة البضاعة ${money(kpis.totalCogs, currency)}، التشغيل ${money(kpis.totalOpex, currency)}، صافي الربح ${money(kpis.netProfit, currency)} (هامش ${kpis.profitMargin.toFixed(1)}%).`;
  }

  if (/(مصروف|مصاريف|expense|opex|تكاليف)/.test(q) && !/(منتج|product)/.test(q)) {
    const lines = result.expenseBreakdown.slice(0, 5).map((item) => `• ${item.name}: ${money(item.value, currency)}`);
    return en
      ? `Expenses in «${fileName}»: total ${money(kpis.totalExpenses, currency)} (opex ${money(kpis.totalOpex, currency)}).\n${lines.join("\n")}`
      : `المصاريف في «${fileName}»: الإجمالي ${money(kpis.totalExpenses, currency)} (تشغيل ${money(kpis.totalOpex, currency)}).\n${lines.join("\n")}`;
  }

  const named = findProduct(q, catalog);
  if (named) {
    return en
      ? `In the open file «${fileName}», ${productLine(named, currency, true)}. Sold ${named.quantity} units across ${named.saleCount} rows.`
      : `في الملف المفتوح «${fileName}»، ${productLine(named, currency, false)}. الكمية المباعة ${named.quantity} عبر ${named.saleCount} صف.`;
  }

  const extra = [...catalog].sort((a, b) => b.profit - a.profit).slice(0, 3);
  if (en) {
    return [
      `Answering from the open file «${fileName}» (${rowCount} rows).`,
      `Sales ${money(kpis.totalRevenue, currency)} • net profit ${money(kpis.netProfit, currency)} • margin ${kpis.profitMargin.toFixed(1)}% • health ${health.score}/100.`,
      topProfit ? `Highest profit: ${productLine(topProfit, currency, true)}.` : "",
      extra.length ? `Top products:\n${extra.map((item, i) => `${i + 1}) ${productLine(item, currency, true)}`).join("\n")}` : "",
      forecast.willLoseNextMonth ? "Warning: next month may close at a loss." : "",
      "Ask anything else about this file: highest profit product, best seller, expenses, forecast, or a product name.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `الإجابة من الملف المفتوح «${fileName}» (${rowCount} صف).`,
    `المبيعات ${money(kpis.totalRevenue, currency)} • صافي الربح ${money(kpis.netProfit, currency)} • الهامش ${kpis.profitMargin.toFixed(1)}% • الصحة ${health.score}/100.`,
    topProfit ? `الأعلى ربحاً: ${productLine(topProfit, currency, false)}.` : "",
    extra.length ? `أعلى المنتجات:\n${extra.map((item, i) => `${i + 1}) ${productLine(item, currency, false)}`).join("\n")}` : "",
    forecast.willLoseNextMonth ? "تنبيه: الشهر القادم قد يُغلق بخسارة." : "",
    "اسأل أي شيء عن هذا الملف: أعلى منتج ربح، الأكثر مبيعاً، المصاريف، التوقع، أو اسم منتج.",
  ]
    .filter(Boolean)
    .join("\n");
}
