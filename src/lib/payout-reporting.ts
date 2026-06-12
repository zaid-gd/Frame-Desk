import { normalizeStoredProjectStatus } from "./domain-values";
import type { SalaryBatch, WorkItem } from "./types";

export type PayoutPeriod = "month" | "quarter" | "year" | "all";

export type PayoutEditor = {
  userId: string;
  name: string;
};

export type PayoutProjectRow = {
  id: string;
  date: string;
  title: string;
  editorId: string;
  editorName: string;
  workType: string;
  amount: number;
  isSalaryEdit: boolean;
};

export type PayoutBatchRow = {
  id: string;
  number: number;
  date: string;
  editorName: string;
  amount: number;
  paid: boolean;
  paidDate: string;
};

export type PayoutEditorRow = {
  id: string;
  name: string;
  deliveredProjects: number;
  salaryEdits: number;
  manualEarnings: number;
  batchEarnings: number;
  totalEarnings: number;
};

export type PayoutReport = {
  period: PayoutPeriod;
  periodStart: string;
  periodEnd: string;
  deliveredProjects: PayoutProjectRow[];
  batches: PayoutBatchRow[];
  editors: PayoutEditorRow[];
  completedBatchCount: number;
  paidBatchCount: number;
  unpaidBatchCount: number;
  paidBatchEarnings: number;
  unpaidBatchEarnings: number;
  manualEarnings: number;
  batchEarnings: number;
  totalEarnings: number;
};

type BuildPayoutReportOptions = {
  projects: WorkItem[];
  salaryBatches: SalaryBatch[];
  salaryWorkType: string;
  salaryBatchAmount: number;
  profileName: string;
  editors?: PayoutEditor[];
  period: PayoutPeriod;
  now?: Date;
};

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function payoutPeriodRange(period: PayoutPeriod, now = new Date()) {
  if (period === "all") return { start: "", end: "" };
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = period === "year"
    ? new Date(year, 0, 1)
    : period === "quarter"
      ? new Date(year, Math.floor(month / 3) * 3, 1)
      : new Date(year, month, 1);
  const end = period === "year"
    ? new Date(year, 11, 31)
    : period === "quarter"
      ? new Date(year, Math.floor(month / 3) * 3 + 3, 0)
      : new Date(year, month + 1, 0);
  return { start: isoDate(start), end: isoDate(end) };
}

function isInRange(date: string, start: string, end: string) {
  if (!date) return false;
  return (!start || date >= start) && (!end || date <= end);
}

function safeAmount(value: number | undefined, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : Math.max(0, fallback);
}

export function buildPayoutReport({
  projects,
  salaryBatches,
  salaryWorkType,
  salaryBatchAmount,
  profileName,
  editors = [],
  period,
  now,
}: BuildPayoutReportOptions): PayoutReport {
  const range = payoutPeriodRange(period, now);
  const editorNames = new Map(editors.map((editor) => [editor.userId, editor.name]));
  const personalEditorId = "personal";
  const personalEditorName = profileName.trim() || "You";

  const deliveredProjects = projects
    .filter((project) => normalizeStoredProjectStatus(project.status) === "Delivered")
    .filter((project) => isInRange(project.dueDate, range.start, range.end))
    .map((project): PayoutProjectRow => {
      const editorId = project.assigneeUserIds?.[0] || project.ownerUserId || personalEditorId;
      const editorName = editorNames.get(editorId) || (editorId === personalEditorId ? personalEditorName : "Unassigned");
      const isSalaryEdit = project.workType.trim().toLowerCase() === salaryWorkType.trim().toLowerCase();
      return {
        id: project.id,
        date: project.dueDate,
        title: project.title,
        editorId,
        editorName,
        workType: project.workType,
        amount: isSalaryEdit ? 0 : safeAmount(project.earnings),
        isSalaryEdit,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

  const batches = salaryBatches
    .filter((batch) => isInRange(batch.completedDate, range.start, range.end))
    .map((batch): PayoutBatchRow => ({
      id: batch.id,
      number: batch.number,
      date: batch.completedDate,
      editorName: personalEditorName,
      amount: safeAmount(batch.amount, salaryBatchAmount),
      paid: batch.paid ?? false,
      paidDate: batch.paidDate ?? "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);

  const editorRows = new Map<string, PayoutEditorRow>();
  const ensureEditor = (id: string, name: string) => {
    const existing = editorRows.get(id);
    if (existing) return existing;
    const row: PayoutEditorRow = {
      id,
      name,
      deliveredProjects: 0,
      salaryEdits: 0,
      manualEarnings: 0,
      batchEarnings: 0,
      totalEarnings: 0,
    };
    editorRows.set(id, row);
    return row;
  };

  for (const project of deliveredProjects) {
    const row = ensureEditor(project.editorId, project.editorName);
    row.deliveredProjects += 1;
    row.salaryEdits += project.isSalaryEdit ? 1 : 0;
    row.manualEarnings += project.amount;
  }
  for (const batch of batches) {
    ensureEditor(personalEditorId, personalEditorName).batchEarnings += batch.amount;
  }
  for (const row of editorRows.values()) {
    row.totalEarnings = row.manualEarnings + row.batchEarnings;
  }

  const paidBatches = batches.filter((batch) => batch.paid);
  const unpaidBatches = batches.filter((batch) => !batch.paid);
  const manualEarnings = deliveredProjects.reduce((total, project) => total + project.amount, 0);
  const batchEarnings = batches.reduce((total, batch) => total + batch.amount, 0);

  return {
    period,
    periodStart: range.start,
    periodEnd: range.end,
    deliveredProjects,
    batches,
    editors: [...editorRows.values()].sort((a, b) => b.totalEarnings - a.totalEarnings || a.name.localeCompare(b.name)),
    completedBatchCount: batches.length,
    paidBatchCount: paidBatches.length,
    unpaidBatchCount: unpaidBatches.length,
    paidBatchEarnings: paidBatches.reduce((total, batch) => total + batch.amount, 0),
    unpaidBatchEarnings: unpaidBatches.reduce((total, batch) => total + batch.amount, 0),
    manualEarnings,
    batchEarnings,
    totalEarnings: manualEarnings + batchEarnings,
  };
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

export function payoutReportToCsv(report: PayoutReport, currencyCode: string) {
  const rows: Array<Array<string | number>> = [
    ["Record type", "Date", "Reference", "Editor", "Work type / status", "Amount", "Currency"],
    ...report.deliveredProjects.map((project): Array<string | number> => [
      "Delivered project",
      project.date,
      project.title,
      project.editorName,
      project.workType,
      project.amount,
      currencyCode,
    ]),
    ...report.batches.map((batch): Array<string | number> => [
      "Salary batch",
      batch.date,
      `Batch ${batch.number}`,
      batch.editorName,
      batch.paid ? "Paid" : "Unpaid",
      batch.amount,
      currencyCode,
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
