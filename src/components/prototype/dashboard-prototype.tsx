"use client";

// PROTOTYPE — throwaway. Three dashboard variants on the existing / route.

import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleAlert,
  Film,
  Gauge,
  MessageSquareText,
  MoreHorizontal,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SettingsState, WorkItem } from "@/lib/types";
import { useHydratedReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  PrototypeVariantSwitcher,
  type PrototypeVariant,
} from "@/components/prototype/prototype-variant-switcher";

type DashboardActivity = {
  id: string;
  kind: "created" | "updated" | "status" | "delivered" | "team";
  message: string;
  projectId?: string;
  actor?: string;
  createdAt: string;
};

type TeamActivity = {
  _id: string;
  actorName: string;
  kind: string;
  projectId?: string;
  message: string;
  createdAt: string;
};

export type DashboardPrototypeData = {
  settings: SettingsState;
  stats: {
    total: number;
    active: number;
    unpaid: number;
    earned: number;
    salaryEdits: number;
    salaryBatchProgress: number;
  };
  projects: WorkItem[];
  sessionActivity: DashboardActivity[];
  teamActivity: TeamActivity[];
  teamName?: string;
  teamLoading: boolean;
};

type PrototypeProps = DashboardPrototypeData & {
  variant: PrototypeVariant;
};

const surface =
  "border border-[var(--app-border)] bg-[var(--app-panel)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]";
const mutedSurface =
  "border border-[var(--app-border)] bg-[var(--app-soft-panel)]";
const entry = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export function DashboardPrototypeGate({
  data,
  variant,
  children,
}: {
  data: DashboardPrototypeData;
  variant?: PrototypeVariant;
  children: ReactNode;
}) {
  const router = useRouter();
  const [activeVariant, setActiveVariant] = useState(variant);

  useEffect(() => {
    setActiveVariant(variant);
  }, [variant]);

  const changeVariant = useCallback((nextVariant: PrototypeVariant) => {
    const params = new URLSearchParams(window.location.search);
    params.set("variant", nextVariant);
    setActiveVariant(nextVariant);
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  }, [router]);

  if (process.env.NODE_ENV === "production" || activeVariant === undefined) return children;

  return (
    <>
      <DashboardPrototype {...data} variant={activeVariant} />
      <PrototypeVariantSwitcher onChange={changeVariant} variant={activeVariant} />
    </>
  );
}

function DashboardPrototype(props: PrototypeProps) {
  if (props.variant === "B") return <ProductionBoard {...props} />;
  if (props.variant === "C") return <StudioPulse {...props} />;
  return <OperationsLedger {...props} />;
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysFromToday(value: string) {
  const due = parseDate(value);
  if (!due) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function formatDueDate(value: string) {
  const date = parseDate(value);
  if (!date) return "Unscheduled";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return minutes <= 1 ? "Now" : `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

function projectProgress(project: WorkItem) {
  if (project.status === "Delivered") return 100;
  if (project.status === "Review" || project.status === "Client Review") return 84;
  if (project.status === "Revision") return 72;
  if (project.status === "In Progress") return 52;
  if (project.status === "Cancelled") return 0;
  return 16;
}

function stageFor(project: WorkItem) {
  if (project.status === "Delivered") return "Delivered";
  if (["Review", "Revision", "Client Review"].includes(project.status)) return "Review";
  if (project.status === "In Progress") return "Editing";
  return "Planning";
}

function statusTone(status: WorkItem["status"]) {
  if (status === "Delivered") {
    return "border-transparent bg-[var(--app-success-bg)] text-[var(--app-success)]";
  }
  if (["Review", "Revision", "Client Review"].includes(status)) {
    return "border-transparent bg-[var(--app-warning-bg)] text-[var(--app-warning)]";
  }
  if (status === "Cancelled") {
    return "border-transparent bg-[var(--app-danger-bg)] text-[var(--app-danger)]";
  }
  if (status === "In Progress") {
    return "border-transparent bg-[var(--app-active)] text-[var(--app-accent)]";
  }
  return "border-[var(--app-border)] bg-[var(--app-soft-panel)] text-[var(--app-muted)]";
}

function ProjectStatus({ status }: { status: WorkItem["status"] }) {
  return (
    <Badge
      className={cn(
        "h-5 rounded-md px-1.5 text-[9px] font-semibold uppercase tracking-[0.06em]",
        statusTone(status),
      )}
      variant="outline"
    >
      {status}
    </Badge>
  );
}

function ProgressLine({ value, className }: { value: number; className?: string }) {
  return (
    <div
      aria-label={`${value}% complete`}
      className={cn("h-1.5 overflow-hidden rounded-full bg-[var(--app-progress-track)]", className)}
      role="progressbar"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-[var(--app-accent)]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function PrototypeHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[var(--app-border)] px-5 py-5 sm:px-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[var(--app-accent)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[clamp(1.55rem,3vw,2.25rem)] font-semibold tracking-[-0.045em] text-[var(--app-ink)]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">{description}</p>
      </div>
      {children}
    </header>
  );
}

const columnHelper = createColumnHelper<WorkItem>();

function OperationsLedger(props: PrototypeProps) {
  const reduceMotion = useHydratedReducedMotion();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return props.projects;
    return props.projects.filter((project) =>
      [project.title, project.client, project.workType, project.status]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized)),
    );
  }, [props.projects, query]);

  const columns = useMemo(() => [
    columnHelper.accessor("title", {
      header: "Project",
      cell: ({ row }) => (
        <div className="min-w-[210px]">
          <p className="truncate text-[13px] font-medium text-[var(--app-ink)]">{row.original.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-[var(--app-muted)]">
            {row.original.client || "Independent"} · {row.original.workType}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Stage",
      cell: ({ getValue }) => <ProjectStatus status={getValue()} />,
    }),
    columnHelper.accessor("dueDate", {
      header: "Due",
      cell: ({ getValue, row }) => {
        const days = daysFromToday(getValue());
        return (
          <div>
            <p className={cn(
              "text-xs font-medium",
              days < 0 && row.original.status !== "Delivered"
                ? "text-[var(--app-danger)]"
                : "text-[var(--app-ink)]",
            )}>
              {formatDueDate(getValue())}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--app-muted)]">
              {days < 0 ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d left`}
            </p>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const progress = projectProgress(row.original);
        return (
          <div className="w-28">
            <div className="mb-1.5 flex justify-between text-[10px] text-[var(--app-muted)]">
              <span>{stageFor(row.original)}</span><span>{progress}%</span>
            </div>
            <ProgressLine value={progress} />
          </div>
        );
      },
    }),
    columnHelper.accessor("earnings", {
      header: "Value",
      cell: ({ getValue }) => (
        <span className="text-xs font-medium tabular-nums text-[var(--app-ink)]">
          {formatMoney(getValue(), props.settings.currencyCode)}
        </span>
      ),
    }),
  ], [props.settings.currencyCode]);

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const urgentProjects = props.projects
    .filter((project) => project.status !== "Delivered")
    .sort((a, b) => daysFromToday(a.dueDate) - daysFromToday(b.dueDate))
    .slice(0, 4);
  const dueThisWeek = props.projects.filter((project) => {
    const days = daysFromToday(project.dueDate);
    return project.status !== "Delivered" && days >= 0 && days <= 7;
  }).length;
  const atRisk = props.projects.filter((project) =>
    project.status !== "Delivered" && daysFromToday(project.dueDate) <= 2,
  ).length;
  const activities = [
    ...props.sessionActivity.map((activity) => ({
      id: activity.id,
      actor: activity.actor || "You",
      message: activity.message,
      createdAt: activity.createdAt,
    })),
    ...props.teamActivity.map((activity) => ({
      id: activity._id,
      actor: activity.actorName,
      message: activity.message,
      createdAt: activity.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="min-h-[calc(100dvh-56px)] bg-[var(--app-canvas)] pb-24">
      <PrototypeHeader
        description="A precise command center for scanning commitments, money, and handoffs without opening every project."
        eyebrow="Variant A · Operations ledger"
        title={`Good morning, ${props.settings.profileName?.split(" ")[0] || "editor"}.`}
      >
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--app-muted)]" />
          <Input
            aria-label="Filter projects"
            className="h-9 rounded-lg border-[var(--app-border)] bg-[var(--app-panel)] pl-9 text-xs"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter the ledger"
            value={query}
          />
        </div>
      </PrototypeHeader>

      <motion.div
        animate="visible"
        className="mx-auto max-w-[1540px] px-5 py-5 sm:px-7"
        initial={reduceMotion ? false : "hidden"}
        variants={entry}
      >
        <section className="grid gap-px overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-border)] sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-[var(--app-panel)] px-4 py-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">In motion</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{props.stats.active}</p>
              <span className="text-[10px] text-[var(--app-muted)]">of {props.stats.total} projects</span>
            </div>
          </div>
          <div className="bg-[var(--app-panel)] px-4 py-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">Due this week</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{dueThisWeek}</p>
              <span className="text-[10px] text-[var(--app-muted)]">upcoming handoffs</span>
            </div>
          </div>
          <div className="bg-[var(--app-panel)] px-4 py-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">Needs attention</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className={cn(
                "text-xl font-semibold tracking-[-0.04em]",
                atRisk ? "text-[var(--app-danger)]" : "text-[var(--app-ink)]",
              )}>
                {atRisk}
              </p>
              <span className="text-[10px] text-[var(--app-muted)]">late or due soon</span>
            </div>
          </div>
          <div className="bg-[var(--app-panel)] px-4 py-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">Earned</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">
                {formatMoney(props.stats.earned, props.settings.currencyCode)}
              </p>
              <span className="text-[10px] text-[var(--app-muted)]">{props.stats.unpaid} unpaid</span>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <section className={cn(surface, "min-w-0 overflow-hidden rounded-xl")}>
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold tracking-[-0.02em] text-[var(--app-ink)]">Work ledger</h2>
                <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">{rows.length} visible commitments</p>
              </div>
              <Badge className="rounded-md border-[var(--app-border)] bg-transparent text-[10px] text-[var(--app-muted)]" variant="outline">
                Read only
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr className="border-b border-[var(--app-border)] bg-[var(--app-soft-panel)]/50" key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          aria-sort={
                            header.column.getIsSorted() === "asc"
                              ? "ascending"
                              : header.column.getIsSorted() === "desc"
                                ? "descending"
                                : "none"
                          }
                          className="whitespace-nowrap px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]"
                          key={header.id}
                        >
                          {header.isPlaceholder ? null : (
                            <button
                              className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]"
                              onClick={header.column.getToggleSortingHandler()}
                              type="button"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() ? <ArrowUpRight className="size-2.5 opacity-50" /> : null}
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr className="border-b border-[var(--app-border)] last:border-0 hover:bg-[var(--app-soft-panel)]/55" key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td className="px-4 py-3" key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!table.getRowModel().rows.length ? (
                <div className="px-5 py-14 text-center text-sm text-[var(--app-muted)]">No projects match that filter.</div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-5">
            <section className={cn(surface, "rounded-xl p-4")}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--app-ink)]">Next up</h2>
                <CalendarDays className="size-4 text-[var(--app-muted)]" />
              </div>
              <div className="mt-4 space-y-1">
                {urgentProjects.map((project) => (
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[var(--app-soft-panel)]" key={project.id}>
                    <span className={cn(
                      "size-2 rounded-full",
                      daysFromToday(project.dueDate) <= 2 ? "bg-[var(--app-danger)]" : "bg-[var(--app-accent)]",
                    )} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[var(--app-ink)]">{project.title}</p>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--app-muted)]">{project.client || project.workType}</p>
                    </div>
                    <span className="text-[10px] tabular-nums text-[var(--app-muted)]">{formatDueDate(project.dueDate)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={cn(surface, "rounded-xl p-4")}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--app-ink)]">Activity</h2>
                  <p className="mt-0.5 text-[10px] text-[var(--app-muted)]">{props.teamName || "Personal workspace"}</p>
                </div>
                <Activity className="size-4 text-[var(--app-muted)]" />
              </div>
              <div className="mt-4 space-y-3">
                {activities.length ? activities.map((activity) => (
                  <div className="flex gap-2.5" key={activity.id}>
                    <Avatar className="size-6 border border-[var(--app-border)]">
                      <AvatarFallback className="bg-[var(--app-active)] text-[9px] text-[var(--app-accent)]">
                        {activity.actor.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[11px] leading-4 text-[var(--app-ink)]">{activity.message}</p>
                      <p className="mt-0.5 text-[9px] text-[var(--app-muted)]">{activity.actor} · {relativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="py-5 text-center text-xs text-[var(--app-muted)]">Activity will appear here.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}

const boardStages = ["Planning", "Editing", "Review", "Delivered"] as const;

function ProductionBoard(props: PrototypeProps) {
  const reduceMotion = useHydratedReducedMotion();
  const grouped = useMemo(() => Object.fromEntries(
    boardStages.map((stage) => [
      stage,
      props.projects.filter((project) => stageFor(project) === stage),
    ]),
  ) as Record<(typeof boardStages)[number], WorkItem[]>, [props.projects]);

  const dueThisWeek = props.projects.filter((project) => {
    const days = daysFromToday(project.dueDate);
    return project.status !== "Delivered" && days >= 0 && days <= 7;
  }).length;

  return (
    <div className="min-h-[calc(100dvh-56px)] bg-[var(--app-canvas)] pb-24">
      <PrototypeHeader
        description="A stage-first workspace for production teams who think in movement, bottlenecks, and handoffs."
        eyebrow="Variant B · Production board"
        title="The studio floor"
      >
        <div className="flex items-center gap-2">
          <Badge className="h-8 rounded-lg border-[var(--app-border)] bg-[var(--app-panel)] px-3 text-[10px] text-[var(--app-muted)]" variant="outline">
            <UsersRound className="mr-1.5 size-3" />
            {props.teamName || "Personal workspace"}
          </Badge>
          <Badge className="h-8 rounded-lg border-[var(--app-border)] bg-[var(--app-ink)] px-3 text-[11px] text-[var(--app-canvas)]">
            <Sparkles className="mr-1.5 size-3" />
            Weekly view
          </Badge>
        </div>
      </PrototypeHeader>

      <motion.div
        animate="visible"
        className="px-5 py-5 sm:px-7"
        initial={reduceMotion ? false : "hidden"}
        variants={entry}
      >
        <section className="mb-5 grid gap-px overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-border)] sm:grid-cols-3">
          <div className="bg-[var(--app-panel)] px-4 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">In motion</p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{props.stats.active}</p>
          </div>
          <div className="bg-[var(--app-panel)] px-4 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">Due this week</p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{dueThisWeek}</p>
          </div>
          <div className="bg-[var(--app-panel)] px-4 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">Awaiting payment</p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{props.stats.unpaid}</p>
          </div>
        </section>

        <ScrollArea className="w-full">
          <div className="grid min-w-[1040px] grid-cols-4 gap-3 pb-4">
            {boardStages.map((stage) => (
              <section className={cn(mutedSurface, "min-h-[560px] rounded-xl p-2.5")} key={stage}>
                <div className="flex items-center justify-between px-1 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "size-2 rounded-full",
                      stage === "Delivered" ? "bg-[var(--app-success)]"
                        : stage === "Review" ? "bg-[var(--app-warning)]"
                          : stage === "Editing" ? "bg-[var(--app-accent)]"
                            : "bg-[var(--app-muted)]",
                    )} />
                    <h2 className="text-xs font-semibold text-[var(--app-ink)]">{stage}</h2>
                    <span className="text-[10px] tabular-nums text-[var(--app-muted)]">{grouped[stage].length}</span>
                  </div>
                  <Button aria-label={`More ${stage} options`} className="size-7 rounded-md text-[var(--app-muted)]" size="icon" type="button" variant="ghost">
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </div>

                <div className="mt-2 space-y-2">
                  {grouped[stage].map((project) => {
                    const progress = projectProgress(project);
                    const overdue = daysFromToday(project.dueDate) < 0 && project.status !== "Delivered";
                    return (
                      <article className={cn(surface, "rounded-lg p-3 transition-transform hover:-translate-y-0.5")} key={project.id}>
                        <div className="flex items-start justify-between gap-3">
                          <Badge className="h-5 rounded-md border-[var(--app-border)] bg-transparent px-1.5 text-[9px] font-medium text-[var(--app-muted)]" variant="outline">
                            {project.workType}
                          </Badge>
                          {overdue ? <CircleAlert className="size-3.5 text-[var(--app-danger)]" /> : null}
                        </div>
                        <h3 className="mt-3 text-[13px] font-semibold leading-5 tracking-[-0.015em] text-[var(--app-ink)]">{project.title}</h3>
                        <p className="mt-0.5 text-[10px] text-[var(--app-muted)]">{project.client || "Independent"}</p>
                        <div className="mt-4">
                          <div className="mb-1.5 flex justify-between text-[9px] text-[var(--app-muted)]">
                            <span>{progress}% complete</span>
                            <span className={overdue ? "text-[var(--app-danger)]" : undefined}>{formatDueDate(project.dueDate)}</span>
                          </div>
                          <ProgressLine value={progress} />
                        </div>
                        <Separator className="my-3 bg-[var(--app-border)]" />
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-1.5">
                            <Avatar className="size-6 border-2 border-[var(--app-panel)]">
                              <AvatarFallback className="bg-[var(--app-active)] text-[8px] text-[var(--app-accent)]">
                                {(project.client || props.settings.profileName || "FD").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-[var(--app-muted)]">
                            <MessageSquareText className="size-3" />
                            {project.checklistItems?.length ?? 0}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {!grouped[stage].length ? (
                    <div className="rounded-lg border border-dashed border-[var(--app-border)] px-3 py-10 text-center text-[10px] text-[var(--app-muted)]">
                      No projects in {stage.toLowerCase()}
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
}

function StudioPulse(props: PrototypeProps) {
  const reduceMotion = useHydratedReducedMotion();
  const activeProjects = props.projects
    .filter((project) => project.status !== "Delivered" && project.status !== "Cancelled")
    .sort((a, b) => daysFromToday(a.dueDate) - daysFromToday(b.dueDate));
  const chartData = activeProjects.slice(0, 8).map((project, index) => ({
    name: project.title.length > 12 ? `${project.title.slice(0, 11)}…` : project.title,
    pace: projectProgress(project),
    target: Math.min(100, 28 + index * 9),
  }));
  const reviewQueue = activeProjects
    .filter((project) => stageFor(project) === "Review" || /review|feedback|approval/i.test(project.notes))
    .slice(0, 4);
  const deadlines = activeProjects.slice(0, 6);
  const completionRate = props.stats.total
    ? Math.round((props.projects.filter((project) => project.status === "Delivered").length / props.stats.total) * 100)
    : 0;

  return (
    <div className="min-h-[calc(100dvh-56px)] bg-[var(--app-canvas)] pb-24">
      <PrototypeHeader
        description="A time-and-capacity dashboard for spotting production drift before it becomes a missed delivery."
        eyebrow="Variant C · Studio pulse"
        title="Production at a glance"
      >
        <div className="flex items-center gap-2 text-xs text-[var(--app-muted)]">
          <span className="size-2 rounded-full bg-[var(--app-success)] shadow-[0_0_0_4px_var(--app-success-bg)]" />
          Live workspace signal
        </div>
      </PrototypeHeader>

      <motion.div
        animate="visible"
        className="mx-auto grid max-w-[1540px] gap-5 px-5 py-5 sm:px-7 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]"
        initial={reduceMotion ? false : "hidden"}
        variants={entry}
      >
        <div className="space-y-5">
          <section className={cn(surface, "rounded-xl p-5")}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--app-muted)]">Delivery pace</p>
                <div className="mt-2 flex items-end gap-3">
                  <span className="text-4xl font-semibold tracking-[-0.055em] text-[var(--app-ink)]">{completionRate}%</span>
                  <Badge className="mb-1 rounded-md border-transparent bg-[var(--app-success-bg)] text-[10px] text-[var(--app-success)]">
                    <ArrowUpRight className="mr-1 size-3" />
                    on track
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--app-muted)]">Delivered share of your current slate</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--app-muted)]">Active</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--app-ink)]">{props.stats.active}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--app-muted)]">At risk</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--app-danger)]">
                    {activeProjects.filter((project) => daysFromToday(project.dueDate) <= 2).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 h-[310px] w-full">
              {chartData.length ? (
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={chartData} margin={{ bottom: 0, left: -22, right: 4, top: 8 }}>
                    <defs>
                      <linearGradient id="prototype-teal-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--app-accent)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--app-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--app-border)" strokeDasharray="2 4" vertical={false} />
                    <XAxis axisLine={false} dataKey="name" fontSize={9} stroke="var(--app-muted)" tickLine={false} />
                    <YAxis axisLine={false} domain={[0, 100]} fontSize={9} stroke="var(--app-muted)" tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        background: "var(--app-panel)",
                        border: "1px solid var(--app-border)",
                        borderRadius: 8,
                        color: "var(--app-ink)",
                        fontSize: 11,
                      }}
                    />
                    <Area dataKey="target" fill="transparent" stroke="var(--app-muted)" strokeDasharray="4 5" strokeWidth={1} type="monotone" />
                    <Area dataKey="pace" fill="url(#prototype-teal-fill)" stroke="var(--app-accent)" strokeWidth={2} type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center rounded-lg border border-dashed border-[var(--app-border)] text-sm text-[var(--app-muted)]">
                  Add active projects to reveal delivery pace.
                </div>
              )}
            </div>
          </section>

          <section className={cn(surface, "rounded-xl")}>
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--app-ink)]">Today&apos;s run of show</h2>
                <p className="mt-0.5 text-[10px] text-[var(--app-muted)]">Ordered by delivery pressure</p>
              </div>
              <Film className="size-4 text-[var(--app-muted)]" />
            </div>
            <div className="px-5 py-2">
              {deadlines.map((project, index) => (
                <div className="grid grid-cols-[48px_18px_minmax(0,1fr)_auto] items-center gap-3 py-3" key={project.id}>
                  <span className="text-[10px] tabular-nums text-[var(--app-muted)]">{index < 3 ? `${9 + index * 2}:00` : "Later"}</span>
                  <div className="relative flex h-full justify-center">
                    <span className="relative z-10 mt-1 size-2 rounded-full bg-[var(--app-accent)] ring-4 ring-[var(--app-active)]" />
                    {index < deadlines.length - 1 ? <span className="absolute bottom-[-18px] top-3 w-px bg-[var(--app-border)]" /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[var(--app-ink)]">{project.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-[var(--app-muted)]">{project.client || project.workType} · {stageFor(project)}</p>
                  </div>
                  <ProjectStatus status={project.status} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className={cn(surface, "rounded-xl p-5")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--app-muted)]">Capacity</p>
                <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-[var(--app-ink)]">This week</h2>
              </div>
              <Gauge className="size-4 text-[var(--app-accent)]" />
            </div>
            <div className="mt-5 flex items-center gap-5">
              <div
                className="grid size-24 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--app-accent) ${Math.min(92, props.stats.active * 12)}%, var(--app-progress-track) 0)`,
                }}
              >
                <div className="grid size-[76px] place-items-center rounded-full bg-[var(--app-panel)] text-center">
                  <div>
                    <p className="text-xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{Math.min(92, props.stats.active * 12)}%</p>
                    <p className="text-[8px] uppercase tracking-[0.1em] text-[var(--app-muted)]">loaded</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-[11px]">
                <p className="flex items-center gap-2 text-[var(--app-ink)]"><span className="size-1.5 rounded-full bg-[var(--app-accent)]" />{props.stats.active} active edits</p>
                <p className="flex items-center gap-2 text-[var(--app-muted)]"><span className="size-1.5 rounded-full bg-[var(--app-warning)]" />{reviewQueue.length} in review</p>
                <p className="flex items-center gap-2 text-[var(--app-muted)]"><span className="size-1.5 rounded-full bg-[var(--app-border)]" />{Math.max(0, 8 - props.stats.active)} open slots</p>
              </div>
            </div>
          </section>

          <section className={cn(surface, "rounded-xl p-5")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--app-muted)]">Attention queue</p>
                <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-[var(--app-ink)]">Reviews & approvals</h2>
              </div>
              <MessageSquareText className="size-4 text-[var(--app-muted)]" />
            </div>
            <div className="mt-4 space-y-2">
              {reviewQueue.length ? reviewQueue.map((project) => (
                <div className={cn(mutedSurface, "rounded-lg p-3")} key={project.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[var(--app-ink)]">{project.title}</p>
                      <p className="mt-1 truncate text-[10px] text-[var(--app-muted)]">{project.client || "Client review"}</p>
                    </div>
                    <span className="shrink-0 text-[9px] text-[var(--app-muted)]">{formatDueDate(project.dueDate)}</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-[var(--app-border)] py-8 text-center">
                  <Check className="mx-auto size-4 text-[var(--app-success)]" />
                  <p className="mt-2 text-xs text-[var(--app-muted)]">Review queue is clear.</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--app-accent)]/30 bg-[var(--app-active)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--app-accent)]">Revenue signal</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-[var(--app-ink)]">
              {formatMoney(props.stats.earned, props.settings.currencyCode)}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--app-muted)]">
              {props.stats.unpaid ? `${props.stats.unpaid} completed projects still need payment follow-up.` : "Every completed project is marked paid."}
            </p>
          </section>
        </aside>
      </motion.div>
    </div>
  );
}
