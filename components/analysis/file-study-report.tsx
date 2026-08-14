"use client";

import Link from "next/link";
import { CheckCircle2, Columns3, FileSearch, Rows3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { COLUMN_ROLE_META } from "@/lib/column-roles";
import { formatDateAr, formatMoney } from "@/lib/format";
import type { ColumnRole } from "@/lib/types";

const ROLE_ORDER: ColumnRole[] = [
  "date",
  "product",
  "sku",
  "quantity",
  "sellingPrice",
  "costPrice",
  "revenue",
  "expense",
  "category",
  "expenseType",
  "notes",
];

export function FileStudyReport() {
  const { parseResult, result, isDemo, currency } = useAnalysis();

  if (!parseResult || !result) {
    return (
      <Card className="p-8 text-center">
        <FileSearch className="mx-auto mb-3 h-10 w-10 text-slate-500" />
        <p className="text-white">لا يوجد ملف مدروس بعد.</p>
        <p className="mt-2 text-sm text-muted">ارفع Excel أو PDF أو صورة من صفحة رفع الملفات.</p>
        <Link href="/data">
          <Button className="mt-4">الذهاب لرفع ملف</Button>
        </Link>
      </Card>
    );
  }

  const mappedEntries = ROLE_ORDER.map((role) => {
    const header = parseResult.mapping.mapping[role];
    if (!header) return null;
    return {
      role,
      header,
      score: parseResult.mapping.scores[role] ?? 0,
      ...COLUMN_ROLE_META[role],
    };
  }).filter(Boolean) as Array<{
    role: ColumnRole;
    header: string;
    score: number;
    label: string;
    purpose: string;
  }>;

  const totalColumns = parseResult.mapping.headers.length || mappedEntries.length;
  const mappedCount = mappedEntries.length;
  const cleaning = parseResult.cleaning;
  const sample = parseResult.transactions.slice(0, 8);
  const products = new Set(parseResult.transactions.map((tx) => tx.product).filter(Boolean)).size;
  const dated = parseResult.transactions.map((tx) => tx.date).filter((d): d is Date => d instanceof Date);
  const from = dated.length ? dated.reduce((a, b) => (a < b ? a : b)) : null;
  const to = dated.length ? dated.reduce((a, b) => (a > b ? a : b)) : null;

  return (
    <div className="space-y-5">
      {result.warnings.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/8 p-4">
          <p className="mb-2 text-sm font-medium text-amber-200">ملاحظات أثناء القراءة</p>
          <ul className="space-y-1 text-sm leading-6 text-slate-300">
            {result.warnings.slice(0, 8).map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-accent/30 bg-accent/8 p-5">
        <div className="flex flex-wrap items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 text-accent" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">تم دراسة الملف بنجاح</h2>
            <p className="mt-1 text-sm leading-7 text-slate-300">
              تم مسح{" "}
              <span className="text-white">{parseResult.sheets?.length ?? 1}</span> ورقة عمل، وتنظيف{" "}
              <span className="text-white">{cleaning?.sourceRows ?? parseResult.rowCount}</span> صفاً، واكتشاف{" "}
              <span className="text-white">{totalColumns}</span> أعمدة، وفهم{" "}
              <span className="text-white">{mappedCount}</span> منها
              {parseResult.sheetName ? ` — المصدر: ${parseResult.sheetName}` : ""}.
            </p>
            {isDemo && <Badge tone="warning" className="mt-2">بيانات تجريبية للعرض</Badge>}
          </div>
        </div>
      </Card>

      {parseResult.sheets && parseResult.sheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>مسح أوراق العمل (كل التبويبات)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {parseResult.sheets.map((sheet) => (
              <div key={sheet.name} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white/3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{sheet.name}</p>
                  <p className="text-xs text-muted">
                    {sheet.rows} صف • {sheet.validRows} صالح
                    {sheet.reason ? ` — ${sheet.reason}` : ""}
                  </p>
                </div>
                <Badge
                  tone={
                    sheet.role === "detail" ? "success" : sheet.role === "summary" ? "warning" : sheet.role === "empty" ? "neutral" : "info"
                  }
                >
                  {sheet.role === "detail"
                    ? "تفصيل — دُمجت"
                    : sheet.role === "summary"
                      ? "ملخص"
                      : sheet.role === "empty"
                        ? "فارغة"
                        : "تجاهلت"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {cleaning && (
        <div className="grid gap-3 md:grid-cols-5">
          <Card className="p-4">
            <p className="text-xs text-muted">صفوف نُظّفت</p>
            <p className="mt-2 text-2xl font-bold text-white">{cleaning.validRows}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">أعمدة اكتُشفت</p>
            <p className="mt-2 text-2xl font-bold text-white">{cleaning.columnsDetected}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">قيم أُصلحت</p>
            <p className="mt-2 text-2xl font-bold text-white">{cleaning.valuesFixed}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">مكررات حُذفت</p>
            <p className="mt-2 text-2xl font-bold text-white">{cleaning.duplicatesRemoved}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">تحتاج مراجعة</p>
            <p className="mt-2 text-2xl font-bold text-amber-200">{cleaning.reviewNeeded}</p>
          </Card>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted">عدد الأعمدة المكتشفة</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
            <Columns3 className="h-5 w-5 text-primary" />
            {totalColumns}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">الصفوف الصالحة</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
            <Rows3 className="h-5 w-5 text-accent" />
            {parseResult.rowCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">المنتجات</p>
          <p className="mt-2 text-2xl font-bold text-white">{products}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">فترة البيانات</p>
          <p className="mt-2 text-sm font-medium text-white">
            {from && to ? `${formatDateAr(from)} — ${formatDateAr(to)}` : "بدون تاريخ"}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ماذا فهم النظام من كل عمود؟</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mappedEntries.map((entry) => (
            <div key={entry.role} className="rounded-xl border border-border bg-white/3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">
                  عمود الملف: <span className="text-accent">{entry.header}</span>
                </p>
                <Badge tone={entry.score >= 80 ? "success" : "info"}>ثقة {Math.round(entry.score)}%</Badge>
              </div>
              <p className="mt-2 text-sm text-blue-200">اعتُبر: {entry.label}</p>
              <p className="mt-1 text-sm text-muted">{entry.purpose}</p>
            </div>
          ))}

          {parseResult.mapping.unmappedHeaders.length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-slate-200">أعمدة لم تُستخدم في الحساب</p>
              <p className="mt-2 text-sm text-muted">
                {parseResult.mapping.unmappedHeaders.join("، ")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>عيّنة من الصفوف بعد الفهم</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-border">
                <th className="px-2 py-2 font-medium">التاريخ</th>
                <th className="px-2 py-2 font-medium">المنتج</th>
                <th className="px-2 py-2 font-medium">الكمية</th>
                <th className="px-2 py-2 font-medium">سعر البيع</th>
                <th className="px-2 py-2 font-medium">التكلفة</th>
                <th className="px-2 py-2 font-medium">الإيراد</th>
                <th className="px-2 py-2 font-medium">الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {sample.map((tx, index) => (
                <tr key={`${tx.product}-${index}`} className="border-b border-border/60 text-slate-200">
                  <td className="px-2 py-2">{tx.date ? formatDateAr(tx.date) : "—"}</td>
                  <td className="px-2 py-2">{tx.product || "—"}</td>
                  <td className="px-2 py-2">{tx.quantity || "—"}</td>
                  <td className="px-2 py-2">{formatMoney(tx.sellingPrice, currency)}</td>
                  <td className="px-2 py-2">{formatMoney(tx.costPrice, currency)}</td>
                  <td className="px-2 py-2 text-accent">{formatMoney(tx.revenue, currency)}</td>
                  <td className="px-2 py-2">{tx.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard">
          <Button>الأرقام صحيحة؟ انتقل للوحة التشخيص</Button>
        </Link>
        <Link href="/simulator">
          <Button variant="outline">عرض التوقعات</Button>
        </Link>
      </div>
    </div>
  );
}
