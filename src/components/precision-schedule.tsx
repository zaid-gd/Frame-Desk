"use client";

import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Milestone,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { SettingsState, WorkItem } from "@/lib/types";
import { useHydratedReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string, format: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("en", format).format(date) : "No date";
}

function isDelivered(project: WorkItem) {
  return project.status === "Delivered";
}

function statusColor(status: WorkItem["status"]) {
  if (status === "Delivered") return "#2d9b63";
  if (status === "Review" || status === "Revision" || status === "Client Review") return "#cc7a16";
  if (status === "Cancelled") return "#d14343";
  if (status === "In Progress") return "#3478f6";
  return "#7f8898";
}

function statusTone(status: WorkItem["status"]) {
  if (status === "Delivered") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300";
  if (status === "Review" || status === "Revision" || status === "Client Review") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300";
  if (status === "Cancelled") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300";
  if (status === "In Progress") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300";
  return "border-[var(--app-border)] bg-[var(--app-soft-panel)] text-[var(--app-muted)]";
}

function daysUntil(value: string) {
  const date = parseDate(value);
  if (!date) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

const revealTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const;

function weekdayIndex(day: string) {
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
  return index >= 0 ? index : 1;
}

function calendarMonthDays(month: Date, weekStart: string) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  const offset = (first.getDay() - weekdayIndex(weekStart) + 7) % 7;
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date };
  });
}

function orderedWeekdays(weekStart: string) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const start = weekdayIndex(weekStart);
  return [...days.slice(start), ...days.slice(0, start)];
}

function iso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatLongDate(value: string) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(date) : "Select a date";
}

function statusPalette(status: WorkItem["status"]) {
  if (status === "Delivered") return { fg: "var(--app-success)", bg: "color-mix(in_srgb,var(--app-success)_14%,transparent)" };
  if (status === "In Progress") return { fg: "var(--app-warning)", bg: "color-mix(in_srgb,var(--app-warning)_14%,transparent)" };
  if (status === "Cancelled") return { fg: "var(--app-danger)", bg: "color-mix(in_srgb,var(--app-danger)_14%,transparent)" };
  if (status === "Review" || status === "Revision" || status === "Client Review") return { fg: "var(--app-warning)", bg: "color-mix(in_srgb,var(--app-warning)_14%,transparent)" };
  return { fg: "var(--app-highlight)", bg: "var(--app-active)" };
}

function projectProgress(status: WorkItem["status"]) {
  if (status === "Delivered") return 100;
  if (status === "Review" || status === "Revision" || status === "Client Review") return 72;
  if (status === "In Progress") return 48;
  if (status === "Cancelled") return 0;
  return 18;
}

export function PrecisionCalendar({
  projects,
  settings,
  onViewProject,
}: {
  projects: WorkItem[];
  settings: SettingsState;
  onViewProject: (project: WorkItem) => void;
}) {
  const firstProjectDate = projects.find((project) => parseDate(project.dueDate))?.dueDate;
  const initialDate = firstProjectDate ? parseDate(firstProjectDate)! : todayDate();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(iso(todayDate()));
  const reduceMotion = useHydratedReducedMotion();

  const monthDays = useMemo(() => calendarMonthDays(visibleMonth, settings.weekStart), [visibleMonth, settings.weekStart]);
  const weekdays = useMemo(() => orderedWeekdays(settings.weekStart), [settings.weekStart]);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(visibleMonth);
  const selectedProjects = useMemo(() => projects
    .filter((project) => project.dueDate === selectedDate)
    .sort((a, b) => a.title.localeCompare(b.title)), [projects, selectedDate]);
  const monthProjectCount = useMemo(() => projects.filter((project) => {
    const due = parseDate(project.dueDate);
    return due?.getFullYear() === visibleMonth.getFullYear() && due.getMonth() === visibleMonth.getMonth();
  }).length, [projects, visibleMonth]);

  function shiftMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function jumpToToday() {
    const today = todayDate();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(iso(today));
  }

  return (
    <div className="mx-auto w-full max-w-[1580px] px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
      <div className="mb-5 flex flex-col gap-3 border-b border-[var(--app-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] sm:text-[32px]">Calendar</h1>
          <p className="mt-1.5 text-sm text-[var(--app-muted)]">A delivery-date calendar for planned, active, and delivered work.</p>
        </div>
        <Button variant="outline" className="h-10 border-[var(--app-highlight)] px-4 text-[var(--app-highlight)] hover:bg-[var(--app-active)]" onClick={jumpToToday}>
          <CalendarDays className="size-4" />
          Today
        </Button>
      </div>


      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)]">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="flex min-w-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Previous month" className="size-9 border-[var(--app-border)] text-[var(--app-highlight)]" onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <h2 className="truncate text-xl font-semibold">{monthLabel}</h2>
              <Button variant="outline" size="icon" aria-label="Next month" className="size-9 border-[var(--app-border)] text-[var(--app-highlight)]" onClick={() => shiftMonth(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <span className="rounded-md bg-[var(--app-active)] px-2 py-1 text-xs font-semibold text-[var(--app-highlight)]">{monthProjectCount} in month</span>
          </div>

          <div className="grid grid-cols-7 border-l border-t border-[var(--app-border)]">
            {weekdays.map((day) => (
              <div key={day} className="border-b border-r border-[var(--app-border)] px-2 py-2 text-[11px] font-semibold uppercase text-[var(--app-muted)]">
                {day}
              </div>
            ))}
            {monthDays.map((day) => {
              const key = iso(day.date);
              const dayProjects = projects.filter((project) => project.dueDate === key);
              const isCurrentMonth = day.date.getMonth() === visibleMonth.getMonth();
              const isSelected = selectedDate === key;
              const isToday = key === iso(todayDate());

              return (
                <motion.button
                  key={key}
                  type="button"
                  whileTap={reduceMotion ? undefined : { scale: 0.995 }}
                  aria-label={`Select ${formatDate(key, { month: "long", day: "numeric", year: "numeric" })} with ${dayProjects.length} scheduled ${dayProjects.length === 1 ? "delivery" : "deliveries"}`}
                  onClick={() => setSelectedDate(key)}
                  className={cn(
                    "min-h-[84px] border-b border-r border-[var(--app-border)] p-2 text-left outline-none transition-colors hover:bg-[var(--app-hover)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--app-highlight)] md:min-h-[clamp(72px,calc((100dvh-470px)/6),96px)]",
                    isSelected ? "bg-[var(--app-active)]" : isCurrentMonth ? "bg-[var(--app-panel)]" : "bg-[var(--app-soft-panel)] opacity-55",
                    isToday && !isSelected && "shadow-[inset_0_0_0_2px_var(--app-highlight)]",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn("text-[13px] font-semibold", (isSelected || isToday) ? "text-[var(--app-highlight)]" : "text-[var(--app-ink)]")}>{day.date.getDate()}</span>
                    {dayProjects.length ? <span className="grid h-5 min-w-5 place-items-center rounded bg-[var(--app-active)] px-1 text-[11px] font-semibold text-[var(--app-highlight)]">{dayProjects.length}</span> : null}
                  </span>
                  <span className="mt-2 block space-y-1">
                    {dayProjects.slice(0, 1).map((project) => {
                      const palette = statusPalette(project.status);
                      return (
                        <span key={project.id} className="block truncate rounded px-1.5 py-1 text-[11px] font-semibold" style={{ background: palette.bg, color: palette.fg }}>
                          {project.title}
                        </span>
                      );
                    })}
                    {dayProjects.length > 1 ? <span className="block text-[11px] text-[var(--app-muted)]">+{dayProjects.length - 1} more</span> : null}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] p-4">
          <h2 className="text-xl font-semibold">{formatLongDate(selectedDate)}</h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">{selectedProjects.length} scheduled deliveries</p>

          <div className="mt-8 space-y-3">
            {selectedProjects.length ? selectedProjects.map((project) => {
              const palette = statusPalette(project.status);
              return (
                <motion.div
                  key={project.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : revealTransition}
                  className="rounded-md border border-[var(--app-border)] bg-[var(--app-soft-panel)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{project.title}</p>
                      <p className="mt-1 truncate text-xs text-[var(--app-muted)]">{project.client || project.workType}</p>
                    </div>
                    <Badge variant="outline" className={cn("h-5 shrink-0 rounded px-1.5 text-[10px]", statusTone(project.status))}>{project.status}</Badge>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--app-progress-track)]">
                    <div className="h-full rounded-full bg-[var(--app-highlight)]" style={{ width: `${projectProgress(project.status)}%` }} />
                  </div>
                  <Button variant="ghost" className="mt-3 h-8 px-0 text-xs text-[var(--app-highlight)] hover:bg-transparent" onClick={() => onViewProject(project)}>
                    Open project <ArrowRight className="size-3.5" />
                  </Button>
                </motion.div>
              );
            }) : (
              <div className="grid min-h-[520px] place-items-center px-6 text-center">
                <div>
                  <div className="mx-auto grid size-20 place-items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-soft-panel)] text-[var(--app-muted)]">
                    <CalendarDays className="size-8" />
                  </div>
                  <p className="mt-5 text-base font-semibold">Nothing scheduled</p>
                  <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-[var(--app-muted)]">Select a date with project deliveries or add a project due date.</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

type MonthGroup = {
  key: string;
  label: string;
  projects: WorkItem[];
};

export function PrecisionTimeline({
  projects,
  onViewProject,
}: {
  projects: WorkItem[];
  onViewProject: (project: WorkItem) => void;
}) {
  const [filter, setFilter] = useState<"All" | "Active" | "Review" | "Delivered">("All");
  const reduceMotion = useHydratedReducedMotion();
  const visibleProjects = useMemo(() => projects.filter((project) => {
    if (filter === "Active") return !isDelivered(project) && project.status !== "Cancelled";
    if (filter === "Review") return ["Review", "Revision", "Client Review"].includes(project.status);
    if (filter === "Delivered") return isDelivered(project);
    return true;
  }), [filter, projects]);
  const groups = useMemo(() => {
    const sorted = visibleProjects
      .filter((project) => parseDate(project.dueDate))
      .slice()
      .sort((a, b) => (parseDate(a.dueDate)?.getTime() ?? 0) - (parseDate(b.dueDate)?.getTime() ?? 0));
    const map = new Map<string, MonthGroup>();
    for (const project of sorted) {
      const date = parseDate(project.dueDate)!;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const existing = map.get(key);
      if (existing) {
        existing.projects.push(project);
      } else {
        map.set(key, {
          key,
          label: new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date),
          projects: [project],
        });
      }
    }
    return Array.from(map.values());
  }, [visibleProjects]);
  const active = projects.filter((project) => !isDelivered(project) && project.status !== "Cancelled").length;
  const review = projects.filter((project) => ["Review", "Revision", "Client Review"].includes(project.status)).length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
      <div className="flex flex-col gap-4 border-b border-[var(--app-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--app-highlight)]">Delivery planning</p>
          <h1 className="mt-1.5 text-[24px] font-semibold tracking-[-0.015em]">Delivery timeline</h1>
          <p className="mt-1 text-xs text-[var(--app-muted)]">A chronological view of project milestones, reviews, and completed deliveries.</p>
        </div>
        <div className="flex gap-4 text-xs" aria-label="Timeline summary">
          <span><strong className="text-base tabular-nums">{active}</strong><span className="ml-1 text-[var(--app-muted)]">active</span></span>
          <span><strong className="text-base tabular-nums">{review}</strong><span className="ml-1 text-[var(--app-muted)]">in review</span></span>
          <span><strong className="text-base tabular-nums">{projects.filter(isDelivered).length}</strong><span className="ml-1 text-[var(--app-muted)]">delivered</span></span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1" role="group" aria-label="Filter timeline">
        {(["All", "Active", "Review", "Delivered"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={cn(
              "h-8 rounded-md px-3 text-xs font-medium text-[var(--app-muted)] transition-colors hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-highlight)]",
              filter === option && "bg-[var(--app-active)] text-[var(--app-highlight)]",
            )}
          >
            {option}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-[var(--app-muted)]" aria-live="polite">{visibleProjects.length} milestones shown</span>
      </div>

      {groups.length ? (
        <motion.div
          key={filter}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          className="mt-6 space-y-8"
        >
          {groups.map((group, groupIndex) => (
            <motion.section
              key={group.key}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...revealTransition, delay: groupIndex * 0.035 }}
              className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]"
            >
              <div className="md:pt-1">
                <p className="text-sm font-semibold">{group.label}</p>
                <p className="mt-1 text-[11px] text-[var(--app-muted)]">{group.projects.length} milestone{group.projects.length === 1 ? "" : "s"}</p>
              </div>
              <div className="relative border-l border-[var(--app-strong-border)] pl-6">
                <div className="divide-y divide-[var(--app-border)] overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)]">
                  {group.projects.map((project, projectIndex) => (
                    <motion.button
                      key={project.id}
                      type="button"
                      initial={reduceMotion ? false : { opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={reduceMotion ? { duration: 0 } : { ...revealTransition, delay: (groupIndex * 0.035) + (projectIndex * 0.025) }}
                      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
                      className="relative grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-[var(--app-hover)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--app-highlight)] sm:grid-cols-[120px_minmax(0,1fr)_120px_90px] sm:items-center"
                      onClick={() => onViewProject(project)}
                    >
                      <span className="absolute -left-[31px] top-1/2 grid size-3 -translate-y-1/2 place-items-center rounded-full border-2 border-[var(--app-panel)]" style={{ background: statusColor(project.status) }} />
                      <span>
                        <span className="block text-[10px] font-semibold uppercase text-[var(--app-subtle)]">{isDelivered(project) ? "Delivered" : "Expected"}</span>
                        <span className="mt-1 block text-xs font-medium">{formatDate(project.dueDate, { month: "short", day: "numeric" })}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold">{project.title}</span>
                        <span className="mt-1 block truncate text-[11px] text-[var(--app-muted)]">{project.client || project.workType} · {project.notes || "No note"}</span>
                      </span>
                      <Badge variant="outline" className={cn("h-5 w-fit rounded px-1.5 text-[10px]", statusTone(project.status))}>{project.status}</Badge>
                      <span className="flex items-center justify-end gap-1 text-[10px] text-[var(--app-muted)]">
                        {isDelivered(project) ? <CheckCircle2 className="size-3.5 text-[var(--app-success)]" /> : <Clock3 className="size-3.5" />}
                        {isDelivered(project) ? "Complete" : `${Math.max(0, daysUntil(project.dueDate))}d`}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.section>
          ))}
        </motion.div>
      ) : (
        <div className="mt-6 grid min-h-80 place-items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] px-5 text-center">
          <div><Milestone className="mx-auto size-7 text-[var(--app-muted)]" /><p className="mt-2 text-sm font-semibold">No timeline milestones yet</p><p className="mt-1 text-xs text-[var(--app-muted)]">Projects with due dates will appear here.</p></div>
        </div>
      )}
    </div>
  );
}
