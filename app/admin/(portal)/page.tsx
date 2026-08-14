"use client";

import { CreditCard, Eye, FileSpreadsheet, TrendingUp, Users } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminKpi } from "@/components/admin/admin-kpi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminPortal } from "@/context/admin-portal";
import { formatCount, formatUsd } from "@/lib/admin/money";

const ACTIVITY_ICON = {
  analyze: FileSpreadsheet,
  pay: CreditCard,
  user: Users,
};

const ACTIVITY_DOT = {
  analyze: "bg-accent",
  pay: "bg-primary",
  user: "bg-purple",
};

export default function AdminOverviewPage() {
  const { snapshot, ready } = useAdminPortal();

  if (!ready || !snapshot) {
    return <p className="p-6 text-sm text-muted">جاري تحميل اللوحة العامة...</p>;
  }

  return (
    <>
      <AdminHeader title="اللوحة العامة" subtitle="نظرة من أعلى الجبل لصحة منصة Smart Profits" />
      <div className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminKpi
            title="إجمالي الزوار"
            value={formatCount(snapshot.visitors)}
            hint="مقارنة بالفترة السابقة"
            change={snapshot.visitorsChange}
            icon={Eye}
          />
          <AdminKpi
            title="المستخدمون النشطون"
            value={formatCount(snapshot.activeUsers)}
            hint="MAU — من استخدم المنصة"
            icon={Users}
          />
          <AdminKpi
            title="إجمالي الإيرادات / MRR"
            value={formatUsd(snapshot.mrr)}
            hint="دخل شهري متكرر"
            icon={CreditCard}
          />
          <AdminKpi
            title="صافي ربح المنصة"
            value={formatUsd(snapshot.netProfit)}
            hint="الدخل − المصاريف التشغيلية"
            icon={TrendingUp}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>المالية — الدخل مقابل المصاريف</CardTitle>
              <div className="flex gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-accent" /> المبيعات والاشتراكات
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-slate-400" /> التكاليف
                </span>
              </div>
            </CardHeader>
            <CardContent className="h-[280px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshot.revenueSeries}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="revenue" name="الدخل" stroke="#10b981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="expenses" name="المصاريف" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>نمو المستخدمين</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshot.userGrowth}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="users" name="مسجّلون جدد" stroke="#3b82f6" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>جدول النشاط الفوري</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshot.activity.map((item) => {
              const Icon = ACTIVITY_ICON[item.icon];
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-white/3 px-4 py-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${ACTIVITY_DOT[item.icon]}`} />
                  <Icon className="h-4 w-4 text-slate-400" />
                  <p className="flex-1 text-sm text-slate-200">{item.text}</p>
                  <span className="text-xs text-muted">{item.time}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
