"use client";

import { AdvisorAskBox } from "@/components/advisor/ask-box";
import { AdvisorHelpCards } from "@/components/advisor/help-cards";
import { AppHeader } from "@/components/layout/app-header";
import { useAppearance } from "@/context/appearance";

export default function AdvisorPage() {
  const { t } = useAppearance();
  return (
    <>
      <AppHeader title={t("advisor.title")} subtitle={t("advisor.subtitle")} />
      <div className="grid gap-5 p-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <AdvisorAskBox chat />
        </div>
        <div className="xl:col-span-4">
          <AdvisorHelpCards />
        </div>
      </div>
    </>
  );
}
