import type { ColumnMapping, ColumnRole, MappingResult } from "./types";

const ROLE_ALIASES: Record<ColumnRole, string[]> = {
  date: [
    "date",
    "datetime",
    "timestamp",
    "created at",
    "created_at",
    "day",
    "التاريخ",
    "تاريخ",
    "تاريخ الحركه",
    "تاريخ الحركة",
    "تاريخ العمليه",
    "تاريخ العملية",
    "تاريخ البيع",
    "يوم",
    "شهر",
    "الشهر",
    "month",
    "period",
  ],
  product: [
    "product",
    "product name",
    "item",
    "item name",
    "name",
    "المنتج",
    "اسم المنتج",
    "الصنف",
    "اسم الصنف",
    "السلعه",
    "السلعة",
  ],
  sku: ["sku", "barcode", "code", "الكود", "رمز", "كود المنتج", "الباركود"],
  quantity: [
    "qty",
    "quantity",
    "units",
    "pcs",
    "الكمية",
    "الكميه",
    "عدد",
    "الكميات",
    "قطعه",
    "قطعة",
  ],
  sellingPrice: [
    "price",
    "selling price",
    "unit price",
    "sale price",
    "سعر البيع",
    "السعر",
    "سعر الوحده",
    "سعر الوحدة",
    "سعر",
  ],
  costPrice: [
    "cost",
    "cost price",
    "purchase",
    "purchase price",
    "cogs",
    "unit cost",
    "التكلفه",
    "التكلفة",
    "سعر التكلفه",
    "سعر التكلفة",
    "سعر الشراء",
    "تكلفة الوحده",
    "تكلفة الوحدة",
    "المشتريات",
  ],
  revenue: [
    "sale",
    "sales",
    "revenue",
    "amount",
    "total",
    "line total",
    "المبيعات",
    "الايراد",
    "الإيراد",
    "ايرادات",
    "إيرادات",
    "اجمالي",
    "إجمالي",
    "المبلغ",
    "اجمالي المبيعات",
    "إجمالي المبيعات",
  ],
  expense: [
    "expense",
    "expenses",
    "operating",
    "opex",
    "مصروف",
    "المصروف",
    "المصاريف",
    "مصاريف",
    "تكلفه تشغيليه",
    "تكلفة تشغيلية",
  ],
  category: [
    "category",
    "section",
    "group",
    "الفئه",
    "الفئة",
    "تصنيف",
    "نوع",
    "القسم",
    "التصنيف",
  ],
  expenseType: [
    "expense type",
    "expense_type",
    "type",
    "نوع المصروف",
    "نوع المصاريف",
  ],
  notes: [
    "notes",
    "note",
    "remark",
    "remarks",
    "الملاحظات",
    "ملاحظات",
    "ملاحظة",
    "البيان",
    "الوصف",
  ],
};

export function stripTashkeel(value: string) {
  return value.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
}

export function normalizeHeader(header: string) {
  return stripTashkeel(header)
    .toLowerCase()
    .trim()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[_./\\-]+/g, " ")
    .replace(/\s+/g, " ");
}

function scoreAlias(header: string, alias: string) {
  const h = normalizeHeader(header);
  const a = normalizeHeader(alias);
  if (!h || !a) return 0;
  if (h === a) return 100;
  if (h.includes(a) || a.includes(h)) return 82;
  const hWords = h.split(" ");
  const aWords = a.split(" ");
  const overlap = aWords.filter((w) => hWords.includes(w)).length;
  if (overlap > 0) return 55 + overlap * 8;
  return 0;
}

function bestScore(header: string, role: ColumnRole) {
  return Math.max(...ROLE_ALIASES[role].map((alias) => scoreAlias(header, alias)));
}

export function detectColumns(headers: string[]): MappingResult {
  const used = new Set<string>();
  const mapping: ColumnMapping = {};
  const scores: Partial<Record<ColumnRole, number>> = {};
  const warnings: string[] = [];

  const roles = Object.keys(ROLE_ALIASES) as ColumnRole[];
  const candidates = roles.flatMap((role) =>
    headers.map((header) => ({
      role,
      header,
      score: bestScore(header, role),
    })),
  );

  candidates
    .filter((c) => c.score >= 55)
    .sort((a, b) => b.score - a.score)
    .forEach((candidate) => {
      if (mapping[candidate.role] || used.has(candidate.header)) return;
      mapping[candidate.role] = candidate.header;
      scores[candidate.role] = candidate.score;
      used.add(candidate.header);
    });

  if (!mapping.date) {
    warnings.push("لم يُعثر على عمود تاريخ. سيتم تحليل الملف كفترة واحدة.");
  }
  if (!mapping.revenue && !mapping.sellingPrice) {
    warnings.push(
      "لم يُعثر على عمود مبيعات أو سعر بيع. تأكد أن الملف يحتوي على أحد الأسماء: المبيعات، سعر البيع، Price.",
    );
  }
  if (!mapping.costPrice && !mapping.expense) {
    warnings.push(
      "لم يُعثر على عمود تكلفة أو مصروف. سيتم احتساب المصاريف التشغيلية من الإعدادات فقط.",
    );
  }

  const unmappedHeaders = headers.filter((header) => !used.has(header));

  return { mapping, scores, headers, unmappedHeaders, warnings };
}

export function mappedRoleCount(headers: string[]) {
  return Object.keys(detectColumns(headers).mapping).length;
}

const EXTRA_SPLIT_LABELS = [
  "الملاحظات",
  "ملاحظات",
  "notes",
  "note",
  "البيان",
  "الوصف",
  "description",
];

export function stripKnownHeaders(text: string): string {
  const labels = [...Object.values(ROLE_ALIASES).flat(), ...EXTRA_SPLIT_LABELS]
    .filter((alias) => alias.length >= 3)
    .sort((a, b) => b.length - a.length);

  let result = text;
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), " ");
  }
  return result.replace(/\s+/g, " ").trim();
}

export function findHeaderTokens(text: string): string[] {
  const normalized = normalizeHeader(text);
  if (!normalized) return [];

  const labels = [
    ...Object.values(ROLE_ALIASES).flat(),
    ...EXTRA_SPLIT_LABELS,
  ]
    .map((alias) => ({ alias, norm: normalizeHeader(alias) }))
    .filter((item) => item.norm.length >= 3)
    .sort((a, b) => b.norm.length - a.norm.length);

  const taken = new Array(normalized.length).fill(false);
  const found: { start: number; alias: string }[] = [];

  for (const { alias, norm } of labels) {
    let from = 0;
    while (from <= normalized.length - norm.length) {
      const pos = normalized.indexOf(norm, from);
      if (pos < 0) break;
      const overlaps = taken.slice(pos, pos + norm.length).some(Boolean);
      if (!overlaps) {
        found.push({ start: pos, alias });
        for (let i = pos; i < pos + norm.length; i += 1) taken[i] = true;
        break;
      }
      from = pos + 1;
    }
  }

  return found.sort((a, b) => a.start - b.start).map((item) => item.alias);
}
