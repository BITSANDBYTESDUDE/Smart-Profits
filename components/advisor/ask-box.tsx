"use client";

import { useState } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnalysis } from "@/context/analysis-context";
import { useAppearance } from "@/context/appearance";
import { answerMerchantQuestion, resultForQuestion } from "@/lib/qa";
import { answerKnowledge, detectKnowledgeTopic } from "@/lib/advisor-knowledge";
import { scopeFromQuestion } from "@/lib/scope";

const HINTS = {
  ar: [
    "معلومات عن الربح",
    "كتب للتجارة",
    "نصائح تسوّق",
    "قواعد الشراء",
    "مين أعلى منتج ربح؟",
    "بدي خطة تسويقية",
    "المنتج الأكثر مبيعاً؟",
    "كميات البيع للمنتجات اللي عرضتها؟",
    "شو أشتري أول؟",
    "وين تسريب الربح؟",
    "شو أعمل اليوم؟",
    "مبيعات شهر يناير؟",
    "حلّل منتج سماعات لاسلكية",
  ],
  en: [
    "How does profit work?",
    "Books for merchants",
    "Shopping tips",
    "Purchasing rules",
    "What is the highest profit product?",
    "Give me a marketing plan",
    "What is the best seller?",
    "Sales quantities for those products?",
    "What should I buy first?",
    "Where is the profit leak?",
    "What should I do today?",
    "January sales?",
    "Analyze wireless headphones",
  ],
} as const;

interface ChatTurn {
  q: string;
  a: string;
}

export function AdvisorAskBox({ chat = false }: { chat?: boolean }) {
  const { result, currency, parseResult, settings, taxonomy, scope, setScope } = useAnalysis();
  const { t, locale } = useAppearance();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const hints = HINTS[locale];

  function ask(next = question) {
    const text = next.trim();
    if (!text) return;
    if (!result) {
      const topic = detectKnowledgeTopic(text);
      const answer = topic ? answerKnowledge(topic, locale) : t("advisor.chat.needFile");
      setTurns((prev) => [...prev, { q: text, a: answer }]);
      setQuestion("");
      return;
    }
    const nextScope = parseResult ? scopeFromQuestion(text, parseResult.transactions, scope) : scope;
    if (
      nextScope.monthKey !== scope.monthKey ||
      nextScope.product !== scope.product ||
      nextScope.sheet !== scope.sheet
    ) {
      setScope(nextScope);
    }
    const last = turns[turns.length - 1];
    const scoped = resultForQuestion(text, parseResult, settings, taxonomy, result, nextScope) ?? result;
    setTurns((prev) => [
      ...prev,
      {
        q: text,
        a: answerMerchantQuestion(text, scoped, {
          locale,
          currency,
          previousQuestion: last?.q,
          previousAnswer: last?.a,
        }),
      },
    ]);
    setQuestion("");
  }

  return (
    <Card className={chat ? "flex min-h-[520px] flex-col" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="h-4 w-4 text-primary" />
          {t("advisor.chat.title")}
        </CardTitle>
        {result?.fileName && (
          <p className="text-xs text-muted">
            {t("advisor.chat.from")}: {result.fileName}
          </p>
        )}
      </CardHeader>
      <CardContent className={chat ? "flex flex-1 flex-col gap-3" : "space-y-3"}>
        <div className="flex flex-wrap gap-2">
          {hints.map((hint) => (
            <button
              key={hint}
              type="button"
              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
              onClick={() => ask(hint)}
            >
              {hint}
            </button>
          ))}
        </div>

        <div className={chat ? "min-h-0 flex-1 space-y-3 overflow-y-auto" : "space-y-3"}>
          {turns.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm leading-7 text-muted">
              {t("advisor.chat.empty")}
            </p>
          )}
          {turns.map((turn, index) => (
            <div key={`${turn.q}-${index}`} className="space-y-2">
              <p className="rounded-2xl bg-primary/15 px-4 py-2 text-sm text-foreground whitespace-pre-wrap">{turn.q}</p>
              <p className="rounded-2xl border border-border bg-black/[0.03] px-4 py-3 text-sm leading-7 text-foreground whitespace-pre-wrap dark:bg-white/3">
                {turn.a}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t("advisor.chat.placeholder")}
            onKeyDown={(event) => {
              if (event.key === "Enter") ask();
            }}
          />
          <Button onClick={() => ask()}>
            <Send className="h-4 w-4" />
            {t("advisor.chat.send")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
