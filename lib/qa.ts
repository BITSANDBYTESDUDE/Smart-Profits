import type { AnalysisResult } from "./types";

function norm(q: string) {
  return q
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[؟?]/g, "")
    .trim()
    .toLowerCase();
}

export function answerMerchantQuestion(question: string, result: AnalysisResult): string {
  const q = norm(question);
  const { kpis, advisor, productHighlights } = result;
  const leak = advisor.leaks[0];
  const health = advisor.health;
  const action = advisor.todayActions[0];

  if (!q) return "اكتب سؤالك بالعربي، مثلاً: ليش ربحي هالشهر نزل؟";

  if (/ليش|لماذا|سبب/.test(q) && /ربح|خس/.test(q)) {
    const costNote = kpis.expenseChangePct > kpis.revenueChangePct
      ? `السبب الرئيسي هو ارتفاع التكلفة/المصاريف بنسبة ${kpis.expenseChangePct.toFixed(0)}%، بينما المبيعات ${kpis.revenueChangePct >= 0 ? "زادت" : "نزلت"} ${Math.abs(kpis.revenueChangePct).toFixed(0)}% فقط.`
      : `هامش الربح حالياً ${kpis.profitMargin.toFixed(1)}%. راجع المنتجات ضعيفة الهامش أولاً.`;
    return `${costNote}${leak ? ` وأكبر تسريب ظاهر: «${leak.product}» — ${leak.issue}` : ""}`;
  }

  if (/اشتري|اطلب|مخزون|ينفد|نفاد/.test(q)) {
    const order = advisor.inventory.find((item) => item.decision === "order_now");
    const stop = advisor.inventory.find((item) => item.decision === "dont_buy");
    if (order) return `الأولوية للشراء: «${order.product}». ${order.reason}`;
    if (stop) return `لا تشترِ «${stop.product}» الآن. ${stop.reason}`;
    return "ما في إشارة نفاد وشيكة من الملف. ركّز على المنتجات الأسرع ربحاً فقط.";
  }

  if (/تسريب|هامش|سعر/.test(q)) {
    if (!leak) return "ما ظهر تسريب واضح في الربح من هذا الملف.";
    return `وجدنا تسريباً في «${leak.product}»: مبيعات ${Math.round(leak.revenue)} مقابل ربح ${Math.round(leak.profit)}. ${leak.suggestion}`;
  }

  if (/صحه|صحة|تشخيص|المتجر/.test(q) || /كيف المتجر/.test(q)) {
    return `صحة المتجر ${health.score}/100 (${health.label}). ${health.headline} ${health.findings[0] ? health.findings[0].detail : ""}`;
  }

  if (/اليوم|ماذا افعل|شو اعمل|قرار/.test(q)) {
    if (!action) return "ارفع ملفاً أوضح حتى نقترح قرار اليوم.";
    return `قرار اليوم: ${action.title}. ${action.reason}`;
  }

  if (/شحن|توصيل/.test(q)) {
    const shipping = result.expenseBreakdown.find((item) => /شحن|توصيل|shipping/i.test(item.name));
    return shipping
      ? `تكلفة الشحن/التوصيل ظهرت من عمود المصروف في الملف (${Math.round(shipping.value)}). تُضاف إلى مصاريف التشغيل وتُطرح من المبيعات عند حساب صافي الربح.`
      : "ما ظهر بند شحن واضح في الملف. إن وُجد عمود مصروف فيه كلمة شحن أو توصيل، يُحسب تلقائياً ضمن التشغيل.";
  }

  if (/صافي الربح|كيف (يحسب|تم حساب)/.test(q)) {
    return `صافي الربح = المبيعات − (تكلفة البضاعة + المصاريف التشغيلية مثل الإيجار والرواتب والشحن). حالياً الهامش ${kpis.profitMargin.toFixed(1)}%.`;
  }

  if (/توقع|شهر جاي|القادم/.test(q)) {
    const s = advisor.scenarios;
    return `الشهر القادم — أسوأ حالة ربح ${Math.round(s.worst.profit)}، المتوقع ${Math.round(s.expected.profit)}، وأفضل حالة ${Math.round(s.best.profit)}.`;
  }

  const top = productHighlights.mostProfitable;
  if (/افضل|أحسن|رابح/.test(q) && top) {
    return `الأعلى ربحاً حالياً: «${top.name}» بهامش ${top.margin.toFixed(0)}%.`;
  }

  return `${health.headline} لو حاب تفاصيل: اسأل عن الربح، المخزون، التسريب، أو «شو أعمل اليوم».`;
}
