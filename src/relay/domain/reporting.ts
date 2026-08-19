import type { ProjectRecord } from "./project";
import { deriveSalaryPlanProgress, type SalaryBatch, type SalaryPlan, type SalaryProject } from "./salary-plan";
import type { RelayClient } from "./client";

export type ReportPeriodKind = "month" | "quarter" | "year" | "custom";
export type ReportPeriod = {
  kind: ReportPeriodKind;
  value: string;
  start: string;
  end: string;
  label: string;
};

type ReportPeriodInput =
  | { kind: "month"; value: `${number}-${number}` | string }
  | { kind: "quarter"; value: `${number}-Q${1 | 2 | 3 | 4}` | string }
  | { kind: "year"; value: `${number}` | string }
  | { kind: "custom"; value: { start: string; end: string } };

export type ProjectOutputCount = { projectId: string; count: number };
export type ReportAccess = { canViewMoney: boolean; canViewSalary: boolean };

export type WorkspaceReport = {
  currencyCode: string;
  period: ReportPeriod;
  comparison: { start: string; end: string; label: string };
  work: {
    completedProjectCount: number;
    outputCount: number;
    averageTurnaroundDays: number | null;
    completedProjects: Array<{
      projectId: string;
      projectName: string;
      clientName: string;
      completedAt: string;
      outputCount: number;
      turnaroundDays: number | null;
    }>;
    stageDelays: Array<{ stageId: string; label: string; averageDays: number; projectCount: number }>;
  };
  money: {
    earned: number;
    collected: number;
    outstanding: number;
    clientTotals: Array<{ clientId: string; clientName: string; earned: number; collected: number; outstanding: number }>;
  } | null;
  salary: {
    plans: Array<SalaryPlan & { deliveredProjectCount: number; remainingProjectCount: number; currentAmount: number | null }>;
    completedBatchCount: number;
    receivedBatchCount: number;
    unpaidBatchCount: number;
  } | null;
};

export type DashboardSummary = {
  attention: Array<{ projectId: string; projectName: string; clientName: string; stage: string; reason: string; dueDate: string }>;
  activeStages: Array<{ label: string; count: number }>;
  dueSoon: Array<{ projectId: string; projectName: string; clientName: string; stage: string; dueDate: string }>;
  salaryProgress: Array<SalaryPlan & { deliveredProjectCount: number; remainingProjectCount: number; currentAmount: number | null }>;
  money: WorkspaceReport["money"];
  work: { activeProjectCount: number; completedProjectCount: number };
  activity: Array<{ id: string; projectName: string; detail: string; at: string }>;
};

const DAY_MS = 86_400_000;

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function toDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = toDate(value) ?? new Date(0);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function monthBounds(value: string) {
  const [year, month] = value.split("-").map(Number);
  const start = new Date(Date.UTC(year, (month || 1) - 1, 1));
  const end = new Date(Date.UTC(year, month || 1, 1));
  return { start: isoDate(start), end: isoDate(end), label: start.toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" }) };
}

function quarterBounds(value: string) {
  const match = /^(\d{4})-Q([1-4])$/.exec(value);
  const year = Number(match?.[1] ?? new Date().getUTCFullYear());
  const quarter = Number(match?.[2] ?? 1);
  const start = new Date(Date.UTC(year, (quarter - 1) * 3, 1));
  const end = new Date(Date.UTC(year, quarter * 3, 1));
  return { start: isoDate(start), end: isoDate(end), label: `Q${quarter} ${year}` };
}

function yearBounds(value: string) {
  const year = Number(value) || new Date().getUTCFullYear();
  return { start: `${year}-01-01`, end: `${year + 1}-01-01`, label: String(year) };
}

function periodDuration(period: Pick<ReportPeriod, "start" | "end">) {
  return Math.max(1, Math.round(((toDate(period.end)?.getTime() ?? 0) - (toDate(period.start)?.getTime() ?? 0)) / DAY_MS));
}

export function createReportPeriod(input: ReportPeriodInput): ReportPeriod {
  const bounds = input.kind === "month"
    ? monthBounds(input.value)
    : input.kind === "quarter"
      ? quarterBounds(input.value)
      : input.kind === "year"
        ? yearBounds(input.value)
        : { start: input.value.start, end: input.value.end, label: `${input.value.start} to ${input.value.end}` };
  return {
    kind: input.kind,
    value: typeof input.value === "string" ? input.value : `${input.value.start}:${input.value.end}`,
    ...bounds,
    label: bounds.label,
  };
}

function comparisonFor(period: ReportPeriod) {
  if (period.kind === "month") {
    const start = toDate(period.start) ?? new Date(0);
    start.setUTCMonth(start.getUTCMonth() - 1);
    const bounds = monthBounds(`${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`);
    return { ...bounds };
  }
  if (period.kind === "quarter") {
    const start = toDate(period.start) ?? new Date(0);
    start.setUTCMonth(start.getUTCMonth() - 3);
    const quarter = Math.floor(start.getUTCMonth() / 3) + 1;
    const bounds = quarterBounds(`${start.getUTCFullYear()}-Q${quarter}`);
    return { ...bounds };
  }
  if (period.kind === "year") {
    const year = Number(period.start.slice(0, 4)) - 1;
    return { ...yearBounds(String(year)) };
  }
  const start = addDays(period.start, -periodDuration(period));
  return { start, end: period.start, label: `${start} to ${period.start}` };
}

function isWithin(value: string | undefined, period: Pick<ReportPeriod, "start" | "end">) {
  if (!value) return false;
  const date = dateOnly(value);
  return date >= period.start && date < period.end;
}

function projectAmount(project: ProjectRecord) {
  return project.financialType === "projectValue" ? Math.max(0, project.agreedAmount ?? project.money) : 0;
}

function clientName(clients: readonly RelayClient[], clientId: string) {
  return clients.find((client) => client.id === clientId)?.name ?? "Unknown Client";
}

function stageDelayRows(projects: readonly ProjectRecord[], period: ReportPeriod) {
  const totals = new Map<string, { label: string; totalDays: number; count: number }>();
  for (const project of projects) {
    if (!isWithin(project.completedAt, period)) continue;
    for (const stage of project.stageHistory ?? []) {
      if (stage.purpose === "delivered") continue;
      const start = toDate(stage.enteredAt);
      const end = toDate(stage.exitedAt ?? project.completedAt ?? "");
      if (!start || !end || end <= start) continue;
      const current = totals.get(stage.stageId) ?? { label: stage.label, totalDays: 0, count: 0 };
      current.totalDays += (end.getTime() - start.getTime()) / DAY_MS;
      current.count += 1;
      totals.set(stage.stageId, current);
    }
  }
  return [...totals.entries()]
    .map(([stageId, row]) => ({ stageId, label: row.label, averageDays: row.totalDays / row.count, projectCount: row.count }))
    .sort((left, right) => right.averageDays - left.averageDays || left.label.localeCompare(right.label));
}

function buildMoneyReport(args: {
  period: Pick<ReportPeriod, "start" | "end">;
  clients: readonly RelayClient[];
  projects: readonly ProjectRecord[];
  salaryBatches: readonly SalaryBatch[];
}) {
  const totals = new Map<string, { earned: number; collected: number; outstanding: number }>();
  let earned = 0;
  let collected = 0;
  let outstanding = 0;
  const add = (clientId: string, values: { earned?: number; collected?: number; outstanding?: number }) => {
    const current = totals.get(clientId) ?? { earned: 0, collected: 0, outstanding: 0 };
    current.earned += values.earned ?? 0;
    current.collected += values.collected ?? 0;
    current.outstanding += values.outstanding ?? 0;
    totals.set(clientId, current);
  };
  for (const project of args.projects) {
    if (!isWithin(project.completedAt, args.period)) continue;
    const amount = projectAmount(project);
    if (!amount) continue;
    const isPaid = project.paymentState === "paid";
    earned += amount;
    if (isPaid) collected += amount;
    else outstanding += amount;
    add(project.clientId, { earned: amount, ...(isPaid ? { collected: amount } : { outstanding: amount }) });
  }
  for (const batch of args.salaryBatches) {
    if (!isWithin(batch.completedAt, args.period)) continue;
    const amount = Math.max(0, batch.batchAmount);
    earned += amount;
    if (batch.receivedAt) collected += amount;
    else outstanding += amount;
    add(batch.clientId, { earned: amount, ...(batch.receivedAt ? { collected: amount } : { outstanding: amount }) });
  }
  return {
    earned,
    collected,
    outstanding,
    clientTotals: [...totals.entries()]
      .map(([clientId, values]) => ({ clientId, clientName: clientName(args.clients, clientId), ...values }))
      .sort((left, right) => left.clientName.localeCompare(right.clientName)),
  };
}

export function buildWorkspaceReport(args: {
  period: ReportPeriod;
  currencyCode: string;
  clients: readonly RelayClient[];
  projects: readonly ProjectRecord[];
  outputCounts: readonly ProjectOutputCount[];
  salaryPlans: readonly SalaryPlan[];
  salaryBatches: readonly SalaryBatch[];
  access: ReportAccess;
}): WorkspaceReport {
  const outputCountByProject = new Map(args.outputCounts.map((row) => [row.projectId, row.count]));
  const completedProjects = args.projects.filter((project) => isWithin(project.completedAt, args.period));
  const completedRows = completedProjects.map((project) => {
    const turnaroundDays = project.createdAt && project.completedAt
      ? ((toDate(project.completedAt)?.getTime() ?? 0) - (toDate(project.createdAt)?.getTime() ?? 0)) / DAY_MS
      : null;
    return { projectId: project.id, projectName: project.name, clientName: clientName(args.clients, project.clientId), completedAt: project.completedAt!, outputCount: outputCountByProject.get(project.id) ?? 0, turnaroundDays };
  });
  const turnaroundValues = completedRows.flatMap((row) => row.turnaroundDays === null ? [] : [row.turnaroundDays]);
  const salary = args.access.canViewSalary ? {
    plans: args.salaryPlans.map((plan) => {
      const progress = deriveSalaryPlanProgress(plan, args.projects.map((project): SalaryProject => ({ id: project.id, ...(project.salaryPlanId ? { salaryPlanId: project.salaryPlanId } : {}), ...(project.completedAt ? { completedAt: project.completedAt } : {}) })), args.salaryBatches);
      return { ...plan, deliveredProjectCount: progress.deliveredProjectCount, remainingProjectCount: progress.remainingProjectCount, currentAmount: progress.currentAmount };
    }),
    completedBatchCount: args.salaryBatches.filter((batch) => isWithin(batch.completedAt, args.period)).length,
    receivedBatchCount: args.salaryBatches.filter((batch) => isWithin(batch.completedAt, args.period) && Boolean(batch.receivedAt)).length,
    unpaidBatchCount: args.salaryBatches.filter((batch) => isWithin(batch.completedAt, args.period) && !batch.receivedAt).length,
  } : null;
  return {
    currencyCode: args.currencyCode,
    period: args.period,
    comparison: comparisonFor(args.period),
    work: {
      completedProjectCount: completedProjects.length,
      outputCount: completedRows.reduce((sum, row) => sum + row.outputCount, 0),
      averageTurnaroundDays: turnaroundValues.length ? turnaroundValues.reduce((sum, value) => sum + value, 0) / turnaroundValues.length : null,
      completedProjects: completedRows,
      stageDelays: stageDelayRows(args.projects, args.period),
    },
    money: args.access.canViewMoney ? buildMoneyReport({ period: args.period, clients: args.clients, projects: args.projects, salaryBatches: args.salaryBatches }) : null,
    salary,
  };
}

export function buildDashboardSummary(args: {
  today: string;
  clients: readonly RelayClient[];
  projects: readonly ProjectRecord[];
  salaryPlans: readonly SalaryPlan[];
  salaryBatches: readonly SalaryBatch[];
  outputCounts: readonly ProjectOutputCount[];
  access: ReportAccess;
}): DashboardSummary {
  const active = args.projects.filter((project) => !project.archived && project.workflowSetup.stages.find(({ id }) => id === project.workflowStageId)?.purpose !== "delivered");
  const attention = args.projects.filter((project) => !project.archived && !project.completedAt).flatMap((project) => {
    const purpose = project.workflowSetup.stages.find(({ id }) => id === project.workflowStageId)?.purpose;
    const dueDate = project.dueDate;
    const overdue = dueDate < args.today;
    const review = purpose === "clientReview" || purpose === "revisions";
    if (!overdue && !review) return [];
    return [{ projectId: project.id, projectName: project.name, clientName: clientName(args.clients, project.clientId), stage: project.stage, reason: overdue ? "Overdue" : "Review needs attention", dueDate }];
  }).sort((left, right) => Number(left.reason !== "Overdue") - Number(right.reason !== "Overdue") || left.dueDate.localeCompare(right.dueDate));
  const stageCounts = new Map<string, number>();
  for (const project of active) stageCounts.set(project.stage, (stageCounts.get(project.stage) ?? 0) + 1);
  const activeStages = [...stageCounts.entries()]
    .map(([label, count]) => ({ label, count }));
  const dueSoon = args.projects.filter((project) => !project.archived && !project.completedAt && project.dueDate >= args.today && project.dueDate <= addDays(args.today, 7))
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .map((project) => ({ projectId: project.id, projectName: project.name, clientName: clientName(args.clients, project.clientId), stage: project.stage, dueDate: project.dueDate }));
  const salaryProgress = args.access.canViewSalary ? args.salaryPlans.map((plan) => {
    const progress = deriveSalaryPlanProgress(plan, args.projects.map((project): SalaryProject => ({ id: project.id, ...(project.salaryPlanId ? { salaryPlanId: project.salaryPlanId } : {}), ...(project.completedAt ? { completedAt: project.completedAt } : {}) })), args.salaryBatches);
    return { ...plan, deliveredProjectCount: progress.deliveredProjectCount, remainingProjectCount: progress.remainingProjectCount, currentAmount: progress.currentAmount };
  }) : [];
  const money = args.access.canViewMoney ? buildMoneyReport({ period: { start: "0000-01-01", end: "9999-12-31" }, clients: args.clients, projects: args.projects, salaryBatches: args.salaryBatches }) : null;
  const activity = args.projects.flatMap((project) => [
    ...(project.createdAt ? [{ id: `${project.id}:created`, projectName: project.name, detail: "Project created", at: project.createdAt }] : []),
    ...(project.completedAt ? [{ id: `${project.id}:completed`, projectName: project.name, detail: "Project delivered", at: project.completedAt }] : []),
    ...(project.paidAt ? [{ id: `${project.id}:paid`, projectName: project.name, detail: "Payment marked paid", at: project.paidAt }] : []),
  ]).sort((left, right) => right.at.localeCompare(left.at)).slice(0, 8);
  return { attention, activeStages, dueSoon, salaryProgress, money, work: { activeProjectCount: active.length, completedProjectCount: args.projects.filter((project) => Boolean(project.completedAt)).length }, activity };
}
