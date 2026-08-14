"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RevenueExpenseChart } from "@/components/dashboard/revenue-chart";
import { ExpenseDonut } from "@/components/dashboard/expense-donut";
import { HealthPanel } from "@/components/advisor/health-panel";
import { TodayActions } from "@/components/advisor/today-actions";
import { ProfitLeaks } from "@/components/advisor/profit-leaks";
import { RiskRadar } from "@/components/advisor/risk-radar";
import { ActionPlan } from "@/components/advisor/action-plan";
import { InventoryAdviceTable } from "@/components/advisor/inventory-table";
import { SmartPricingList } from "@/components/advisor/pricing-list";
import { MonthCompare } from "@/components/advisor/month-compare";
import { OpexInsights } from "@/components/dashboard/opex-insights";
import { AppHeader } from "@/components/layout/app-header";
import { useAnalysis } from "@/context/analysis-context";
import { useAppearance } from "@/context/appearance";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trackPlatform } from "@/lib/admin/track";

export default function DashboardPage() {
  const { result, isDemo } = useAnalysis();
  const { user } = useAuth();
  const { t } = useAppearance();

  useEffect(() => {
    if (result) trackPlatform("doctor", undefined, user?.email);
  }, [result, user?.email]);

  return (
    <>
      <AppHeader title={t("dash.title")} subtitle={t("dash.subtitle")} />
      <motion.div
        className="space-y-5 p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {isDemo && (
          <Badge tone="warning">{t("dash.demo")}</Badge>
        )}

        {!result && (
          <Card className="p-8 text-center">
            <p className="text-foreground">{t("dash.needFile")}</p>
            <Link href="/data">
              <Button className="mt-4">{t("dash.goData")}</Button>
            </Link>
          </Card>
        )}

        {result && (
          <>
            <KpiCards />
            <OpexInsights />
            <MonthCompare />
            <div className="grid gap-4 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <RevenueExpenseChart />
              </div>
              <div className="xl:col-span-4">
                <ExpenseDonut />
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <HealthPanel />
              </div>
              <div className="xl:col-span-5">
                <TodayActions />
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <ProfitLeaks />
              <RiskRadar />
            </div>
            <InventoryAdviceTable />
            <div className="grid gap-4 xl:grid-cols-2">
              <SmartPricingList />
              <ActionPlan />
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
