"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WhatIfSimulator } from "@/components/advisor/what-if";
import { ProfitScenariosCard } from "@/components/advisor/scenarios";
import { ForecastChart } from "@/components/forecasts/forecast-chart";
import { Recommendations } from "@/components/forecasts/recommendations";
import { RiskAlertCard } from "@/components/forecasts/risk-alert";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { useAppearance } from "@/context/appearance";
import { useAuth } from "@/context/auth-context";
import { formatMoney } from "@/lib/format";
import { trackPlatform } from "@/lib/admin/track";

export default function SimulatorPage() {
  const { result, currency } = useAnalysis();
  const { user } = useAuth();
  const { t } = useAppearance();

  useEffect(() => {
    trackPlatform("whatif", undefined, user?.email);
  }, [user?.email]);

  return (
    <>
      <AppHeader title={t("sim.title")} subtitle={t("sim.subtitle")} />
      <div className="space-y-5 p-6">
        {!result && (
          <Card className="p-8 text-center">
            <p className="text-foreground">{t("sim.needFile")}</p>
            <Link href="/data">
              <Button className="mt-4">{t("sim.upload")}</Button>
            </Link>
          </Card>
        )}

        {result && (
          <>
            <WhatIfSimulator />
            {result.forecast.willLoseNextMonth != null && (
              <p className="text-sm text-muted">
                {t("sim.nextProfit")}:{" "}
                <span className={result.forecast.willLoseNextMonth ? "text-danger" : "text-accent"}>
                  {formatMoney(result.forecast.nextMonthProfit, currency)}
                </span>
              </p>
            )}
            <RiskAlertCard />
            <ProfitScenariosCard />
            <div className="grid gap-4 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <ForecastChart />
              </div>
              <div className="xl:col-span-4">
                <Recommendations />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
