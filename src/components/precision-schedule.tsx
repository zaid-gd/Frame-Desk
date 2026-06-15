"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg, EventContentArg, EventMountArg } from "@fullcalendar/core";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  FolderOpen,
  Milestone,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
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

function weekStartIndex(value: string) {
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value);
  return index >= 0 ? index : 1;
}

function calendarTimeZone(value: string) {
  if (value === "Pacific Time") return "America/Los_Angeles";
  if (value === "Eastern Time") return "America/New_York";
  return value || "local";
}

const revealTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const;

export function PrecisionCalendar({
  projects,
  settings,
  onViewProject,
}: {
  projects: WorkItem[];
  settings: SettingsState;
  onViewProject: (project: WorkItem) => void;
}) {
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");
  const [calendarTitle, setCalendarTitle] = useState("");
  const [activeView, setActiveView] = useState("dayGridMonth");
  const calendarRef = useRef<FullCalendar>(null);
  const reduceMotion = useHydratedReducedMotion();
  const events = useMemo(() => projects.filter((project) => parseDate(project.dueDate)).map((project) => ({
    id: project.id,
    title: project.title,
    start: project.dueDate,
    allDay: true,
    backgroundColor: statusColor(project.status),
    borderColor: statusColor(project.status),
    textColor: "#ffffff",
    extendedProps: { projectId: project.id },
  })), [projects]);
  const upcoming = useMemo(() => projects
    .filter((project) => !isDelivered(project) && project.status !== "Cancelled" && daysUntil(project.dueDate) >= 0)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
    .slice(0, 8), [projects]);
  const selected = projects.find((project) => project.id === selectedId) ?? upcoming[0] ?? projects[0] ?? null;

  useEffect(() => {
    if (selectedId && !projects.some((project) => project.id === selectedId)) {
      setSelectedId(upcoming[0]?.id ?? projects[0]?.id ?? "");
    }
  }, [projects, selectedId, upcoming]);

  function selectProject(project: WorkItem, openProject = false, revealDate = false) {
    setSelectedId(project.id);
    if (revealDate) calendarRef.current?.getApi().gotoDate(project.dueDate);
    if (openProject) onViewProject(project);
  }

  function handleEventClick(info: EventClickArg) {
    const project = projects.find((item) => item.id === info.event.extendedProps.projectId);
    if (!project) return;
    selectProject(project);
  }

  function handleEventMount(info: EventMountArg) {
    const project = projects.find((item) => item.id === info.event.extendedProps.projectId);
    if (!project) return;
    info.el.tabIndex = 0;
    info.el.setAttribute("role", "button");
    info.el.setAttribute("aria-label", `${project.title}, ${project.status}, due ${formatDate(project.dueDate)}`);
    info.el.onkeydown = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectProject(project);
    };
  }

  function handleDatesSet(info: DatesSetArg) {
    setCalendarTitle(info.view.title);
    setActiveView(info.view.type);
  }

  function renderEventContent(info: EventContentArg) {
    const project = projects.find((item) => item.id === info.event.extendedProps.projectId);
    if (!project) return <span className="truncate">{info.event.title}</span>;
    const isTimeGrid = info.view.type.startsWith("timeGrid");

    return (
      <div className="min-w-0 px-0.5 py-px leading-tight">
        <p className="truncate text-[11px] font-semibold">{project.title}</p>
        {isTimeGrid ? (
          <p className="mt-0.5 truncate text-[9px] opacity-80">{project.client || project.workType} · {project.status}</p>
        ) : null}
      </div>
    );
  }

  function changeView(view: string) {
    calendarRef.current?.getApi().changeView(view);
  }

  const calendarViews = [
    { id: "dayGridMonth", label: "Month" },
    { id: "timeGridWeek", label: "Week" },
    { id: "timeGridDay", label: "Day" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1580px] px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
      <div className="mb-4 border-b border-[var(--app-border)] pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--app-highlight)]">Production schedule</p>
        <h1 className="mt-1.5 text-[24px] font-semibold tracking-[-0.015em]">Calendar</h1>
        <p className="mt-1 text-xs text-[var(--app-muted)]">Plan delivery dates and review checkpoints in {settings.timeZone || "your workspace time zone"}.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] p-3 sm:p-4">
          <div className="mb-3 flex flex-col gap-3 border-b border-[var(--app-border)] pb-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-1">
              <Button variant="outline" size="icon" aria-label="Previous calendar period" title="Previous" onClick={() => calendarRef.current?.getApi().prev()}>
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="icon" aria-label="Next calendar period" title="Next" onClick={() => calendarRef.current?.getApi().next()}>
                <ChevronRight />
              </Button>
              <Button variant="outline" className="ml-1 h-9 px-3 text-xs" onClick={() => calendarRef.current?.getApi().today()}>Today</Button>
              <h2 className="ml-2 min-w-0 truncate text-sm font-semibold sm:text-base" aria-live="polite">{calendarTitle}</h2>
            </div>
            <div className="grid grid-cols-3 rounded-md border border-[var(--app-border)] bg-[var(--app-soft-panel)] p-0.5" role="group" aria-label="Calendar view">
              {calendarViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  aria-pressed={activeView === view.id}
                  className={cn(
                    "h-8 rounded px-3 text-xs font-medium text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-highlight)]",
                    activeView === view.id && "bg-[var(--app-panel)] text-[var(--app-highlight)] shadow-sm",
                  )}
                  onClick={() => changeView(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          <div className="precision-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={upcoming[0]?.dueDate ?? projects.find((project) => parseDate(project.dueDate))?.dueDate}
              headerToolbar={false}
              events={events}
              datesSet={handleDatesSet}
              eventContent={renderEventContent}
              eventClassNames={(info) => info.event.extendedProps.projectId === selected?.id ? ["is-selected"] : []}
              eventClick={handleEventClick}
              eventDidMount={handleEventMount}
              eventWillUnmount={(info) => {
                info.el.onkeydown = null;
              }}
              height="auto"
              dayMaxEvents={3}
              nowIndicator
              firstDay={weekStartIndex(settings.weekStart)}
              timeZone={calendarTimeZone(settings.timeZone)}
              eventDisplay="block"
              displayEventTime={false}
              allDayText="Deadlines"
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              stickyHeaderDates
            />
          </div>
          <p className="mt-3 border-t border-[var(--app-border)] pt-3 text-[10px] text-[var(--app-muted)]">
            Week starts {settings.weekStart || "Mon"} · {settings.timeZone || "Local time"} · Select a deadline to inspect it
          </p>
        </section>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)]">
            <header className="flex h-11 items-center gap-2 px-3">
              <CalendarDays className="size-4 text-[var(--app-muted)]" />
              <h2 className="text-[13px] font-semibold">Upcoming deadlines</h2>
              <span className="ml-auto text-[10px] text-[var(--app-muted)]">{upcoming.length}</span>
            </header>
            {upcoming.length ? (
              <div className="divide-y divide-[var(--app-border)]">
                {upcoming.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    aria-pressed={selected?.id === project.id}
                    className={cn(
                      "relative w-full px-3 py-3 text-left transition-colors hover:bg-[var(--app-hover)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--app-highlight)]",
                      selected?.id === project.id && "bg-[var(--app-active)]",
                    )}
                    onClick={() => selectProject(project, false, true)}
                  >
                    {selected?.id === project.id ? (
                      <motion.span
                        layoutId="calendar-deadline-selection"
                        className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--app-highlight)]"
                        transition={reduceMotion ? { duration: 0 } : revealTransition}
                      />
                    ) : null}
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: statusColor(project.status) }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{project.title}</p>
                        <p className="mt-1 text-[10px] text-[var(--app-muted)]">{formatDate(project.dueDate)} · {project.status}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid min-h-28 place-items-center px-4 text-center text-xs text-[var(--app-muted)]">No active deadlines scheduled.</div>
            )}
          </section>

          <div aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {selected ? (
                <motion.section
                  key={selected.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                  transition={reduceMotion ? { duration: 0 } : revealTransition}
                  className="rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 place-items-center rounded-md bg-[var(--app-soft-panel)]"><FolderOpen className="size-4 text-[var(--app-muted)]" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{selected.title}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">{selected.client || selected.workType}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("mt-3 h-5 rounded px-1.5 text-[10px]", statusTone(selected.status))}>{selected.status}</Badge>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--app-border)] pt-4">
                    <div><p className="text-[9px] uppercase text-[var(--app-subtle)]">Delivery</p><p className="mt-1 text-xs font-medium">{formatDate(selected.dueDate)}</p></div>
                    <div><p className="text-[9px] uppercase text-[var(--app-subtle)]">Work type</p><p className="mt-1 text-xs font-medium">{selected.workType}</p></div>
                  </div>
                  <Button className="mt-4 w-full" onClick={() => onViewProject(selected)}>Open project <ArrowRight /></Button>
                </motion.section>
              ) : null}
            </AnimatePresence>
          </div>
        </aside>
      </div>
      <style jsx global>{`
        .precision-calendar {
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .precision-calendar .fc {
          min-width: 620px;
        }
        .precision-calendar .fc-col-header-cell-cushion,
        .precision-calendar .fc-daygrid-day-number {
          padding: 7px 8px;
          font-weight: 600;
        }
        .precision-calendar .fc-daygrid-day-frame {
          min-height: 96px;
        }
        .precision-calendar .fc-timegrid-axis-cushion,
        .precision-calendar .fc-timegrid-slot-label-cushion {
          color: var(--app-muted);
          font-size: 10px;
        }
        .precision-calendar .fc-event {
          border-radius: 4px;
          cursor: pointer;
          min-height: 0 !important;
          padding: 1px 2px;
        }
        .precision-calendar .fc-event.is-selected {
          box-shadow: 0 0 0 2px var(--app-panel), 0 0 0 4px var(--app-highlight);
          z-index: 4;
        }
        .precision-calendar .fc-event:focus-visible {
          outline: 2px solid var(--app-highlight);
          outline-offset: 2px;
        }
        @media (min-width: 640px) {
          .precision-calendar .fc {
            min-width: 0;
          }
          .precision-calendar .fc-daygrid-day-frame {
            min-height: 112px;
          }
        }
      `}</style>
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
          <h1 className="mt-1.5 text-[24px] font-semibold tracking-[-0.015em]">Timeline</h1>
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
