"use client";

import { useMemo } from "react";
import { useAppearance } from "@/context/appearance";
import { chartPalette, chartTooltipStyle } from "@/lib/chart-theme";

export function useChartTheme() {
  const { theme } = useAppearance();
  return useMemo(
    () => ({
      theme,
      ...chartPalette(theme),
      tooltipStyle: chartTooltipStyle(theme),
    }),
    [theme],
  );
}
