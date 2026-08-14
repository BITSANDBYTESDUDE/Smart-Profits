"use client";

import { CreditCard, Server, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminKpi } from "@/components/admin/admin-kpi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminPortal } from "@/context/admin-portal";
import { formatUsd, formatUsdPrecise } from "@/lib/admin/money";

const TX_TONE = {
  success: "success" as const,
  failed: "danger" as const,
  refunded: "warning" as const,
};

const TX_LABEL = {
  success: "ناجحة",
  failed: "مفلترة",
  refunded: "مسترجعة",
};

export default function AdminFinancialsPage() {
  const { snapshot, ready } = useAdminPortal();

  if (!ready || !snapshot) {
    return <p className="p-6 text-sm text-muted">جاري تحميل الخزينة...</p>;
  }

  const inflowRows = [
    { label: "اشتراكات الباقات (شهري / سنوي)", value: snapshot.inflow.subscriptions },
    { label: "خدمات إضافية وتحليلات", value: snapshot.inflow.addons },
  ];
  const outflowRows = [
    { label: "تكاليف AI API (OpenAI / Anthropic)", value: snapshot.outflow.ai, icon: Sparkles },
    { label: "الاستضافة والسيرفرات (Vercel / AWS / Railway)", value: snapshot.outflow.hosting, icon: Server },
    { label: "عمولات بوابات الدفع (Stripe Fees)", value: snapshot.outflow.payments, icon: CreditCard },
    { label: "التسويق والأدوات الأخرى", value: snapshot.outflow.marketing, icon: Wallet },
  ];

  return (
    <>
      <AdminHeader title="تحليلات المالية والخزينة" subtitle="وين دخل ووين طلع — ضبط شؤون Smart Profits" />
      <div className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminKpi title="إجمالي المداخيل" value={formatUsd(snapshot.inflow.total)} hint="Inflow" icon={TrendingUp} />
          <AdminKpi title="إجمالي المصاريف" value={formatUsd(snapshot.outflow.total)} hint="Outflow" icon={Wallet} />
          <AdminKpi title="هامش ربح المنصة" value={`${snapshot.margin}%`} hint="هل تكلفة AI تأكل الأرباح؟" icon={Sparkles} />
          <AdminKpi title="MRR" value={formatUsd(snapshot.mrr)} hint={`ARPU ${formatUsdPrecise(snapshot.arpu)}`} icon={CreditCard} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>تفصيل مصادر الدخل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inflowRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl border border-border bg-white/3 px-4 py-3">
                  <span className="text-sm text-slate-300">{row.label}</span>
                  <span className="font-semibold text-accent">{formatUsd(row.value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted">الإجمالي</span>
                <span className="font-bold text-white">{formatUsd(snapshot.inflow.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تفصيل التكاليف التشغيلية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {outflowRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center justify-between rounded-xl border border-border bg-white/3 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      <Icon className="h-4 w-4 text-slate-500" />
                      {row.label}
                    </span>
                    <span className="font-semibold text-danger">{formatUsd(row.value)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted">الإجمالي</span>
                <span className="font-bold text-white">{formatUsd(snapshot.outflow.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <p className="text-sm text-muted">مؤشرات SaaS</p>
            <p className="mt-3 text-3xl font-bold text-white">{formatUsd(snapshot.mrr)}</p>
            <p className="mt-1 text-sm text-slate-400">Monthly Recurring Revenue</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted">متوسط ما يدفعه التاجر</p>
            <p className="mt-3 text-3xl font-bold text-white">{formatUsdPrecise(snapshot.arpu)}</p>
            <p className="mt-1 text-sm text-slate-400">ARPU — Average Revenue Per User</p>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>سجل المعاملات المالية</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-start font-medium">رقم الفاتورة</th>
                  <th className="px-3 py-2 text-start font-medium">التاجر</th>
                  <th className="px-3 py-2 text-start font-medium">الباقة</th>
                  <th className="px-3 py-2 text-start font-medium">المبلغ</th>
                  <th className="px-3 py-2 text-start font-medium">الحالة</th>
                  <th className="px-3 py-2 text-start font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.transactions.map((row) => (
                  <tr key={row.invoice} className="border-b border-border/70">
                    <td className="px-3 py-3 font-mono text-xs text-slate-300">{row.invoice}</td>
                    <td className="px-3 py-3 text-white">{row.merchant}</td>
                    <td className="px-3 py-3 text-slate-300">{row.plan}</td>
                    <td className="px-3 py-3 text-white">{formatUsd(row.amount)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={TX_TONE[row.status]}>{TX_LABEL[row.status]}</Badge>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {new Date(row.date).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
