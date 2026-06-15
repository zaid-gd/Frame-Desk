"use client";

import { Box, Stack, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

const accent = "var(--app-accent)";
const muted = "var(--app-muted)";
const border = "var(--app-border)";
const success = "var(--app-success)";
const warning = "var(--app-warning)";

type WorkflowDatum = {
  label: string;
  value: number;
};

export function WorkflowDistributionChart({ data }: { data: readonly WorkflowDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return (
      <Stack justifyContent="center" sx={{ height: 190, borderBlock: `1px solid ${border}` }}>
        <Typography sx={{ color: "var(--app-ink)", fontSize: 14, fontWeight: 700 }}>No active production data</Typography>
        <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>Stage distribution appears after projects enter the workflow.</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ height: 190, width: "100%", minWidth: 0 }}>
      <BarChart
        height={190}
        dataset={data}
        xAxis={[{ scaleType: "band", dataKey: "label", tickLabelStyle: { fill: muted, fontSize: 11 } }]}
        yAxis={[{ min: 0, tickLabelStyle: { fill: muted, fontSize: 10 }, width: 28 }]}
        series={[{ dataKey: "value", color: accent, valueFormatter: (value) => `${value ?? 0} projects` }]}
        grid={{ horizontal: true }}
        borderRadius={3}
        margin={{ top: 12, right: 8, bottom: 24, left: 0 }}
        sx={{
          "& .MuiChartsGrid-line": { stroke: border, strokeDasharray: "3 4" },
          "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": { stroke: border },
        }}
      />
    </Box>
  );
}

type WorkMixDatum = {
  id: string;
  label: string;
  value: number;
};

export function WorkMixChart({ data }: { data: readonly WorkMixDatum[] }) {
  return (
    <Box sx={{ height: 220, width: "100%", minWidth: 0 }}>
      <PieChart
        height={220}
        series={[
          {
            data,
            innerRadius: 56,
            outerRadius: 86,
            paddingAngle: 3,
            cornerRadius: 3,
            highlightScope: { fade: "global", highlight: "item" },
            faded: { additionalRadius: -4, color: border },
          },
        ]}
        colors={[accent, success, warning, "#78909c", "#607d8b", "#90a4ae"]}
        hideLegend
        margin={{ top: 12, bottom: 12, left: 12, right: 12 }}
      />
    </Box>
  );
}
