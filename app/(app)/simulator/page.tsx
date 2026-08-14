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
import { formatMoney } from "@/lib/format";
import { trackPlatform } from "@/lib/admin/track";

export default function SimulatorPage() {
  const { result, currency } = useAnalysis();

  useEffect(() => {
    trackPlatform("whatif");
  }, []);

  return (
    <>
      <AppHeader
        title="محاكي القرارات والتوقعات"
        subtitle="جرّب السعر أو الخصم، ثم شاهد أسوأ / المتوقع / أفضل حالة للأشهر القادمة"
      />
      <div className="space-y-5 p-6">
        {!result && (
          <Card className="p-8 text-center">
            <p className="text-white">المحاكاة والتوقع يحتاجان ملفاً مفتوحاً.</p>
            <Link href="/data">
              <Button className="mt-4">رفع ملف</Button>
            </Link>
          </Card>
        )}

        {result && (
          <>
            <WhatIfSimulator />
            {result.forecast.willLoseNextMonth != null && (
              <p className="text-sm text-muted">
                الربح المتوقع للشهر القادم:{" "}
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
