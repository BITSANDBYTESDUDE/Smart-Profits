"use client";

import { AdvisorAskBox } from "@/components/advisor/ask-box";
import { AdvisorHelpCards } from "@/components/advisor/help-cards";
import { AppHeader } from "@/components/layout/app-header";

export default function AdvisorPage() {
  return (
    <>
      <AppHeader
        title="اسأل المستشار الذكي"
        subtitle="محادثة عربية من بيانات ملفك — مع شرح كيف تُحسب الأرباح وكيف يُقرأ Excel"
      />
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
