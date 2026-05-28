"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { WorkItem, SettingsState, SalaryBatch, SalaryState, TeamMember } from "./types";

const STORAGE_KEY = "video-editing-work-tracker:v1";
const SALARY_STORAGE_KEY = "video-editing-work-tracker:salary-batches:v1";
const SETTINGS_STORAGE_KEY = "video-editing-work-tracker:settings:v1";

type ToastState = { message: string; tone: "success" | "info" | "warning" };

const teamRoleOptions = ["Owner", "Editor", "Reviewer", "Client"];

const defaultSettings: SettingsState = {
  studioName: "CutLab Studio",
  profileName: "Jordan Lee",
  profileTitle: "Video Editor & Storyteller",
  profileBio: "Clean, cinematic edits for creators, campaigns, and client stories.",
  profileLocation: "Los Angeles, CA",
  timeZone: "Asia/Dubai",
  dateFormat: "May 22, 2025",
  weekStart: "Mon",
  projectStages: ["Review", "Edit", "Revision", "Client Review", "Delivered"],
  notifications: {
    "Project updates": true,
    "Feedback received": true,
    "Upcoming deadlines": true,
    Mentions: true,
    "Weekly summary": false,
  },
  integrations: {
    "Google Drive": true,
    Dropbox: false,
    Slack: true,
    "Frame.io": false,
  },
  integrationAccounts: {
    "Google Drive": "CutLab drive",
    Dropbox: "",
    Slack: "cutlab.slack.com",
    "Frame.io": "",
  },
  teamRole: "Editor",
  teamMembers: [
    { id: "member-owner", name: "Jordan Lee", role: "Editor", email: "jordan@cutlab.local" },
  ],
  editorPermissions: {
    "Create and edit projects": true,
    "Upload media and assets": true,
    "Manage project stages": true,
    "Invite team members": true,
    "Manage app settings": false,
  },
  theme: "Light",
  accentColor: "#5b3fa0",
  density: "Comfortable",
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeKey(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

function freshDefaultSettings(): SettingsState {
  return {
    ...defaultSettings,
    projectStages: [...defaultSettings.projectStages],
    notifications: { ...defaultSettings.notifications },
    integrations: { ...defaultSettings.integrations },
    integrationAccounts: { ...defaultSettings.integrationAccounts },
    teamMembers: defaultSettings.teamMembers.map((m: TeamMember) => ({ ...m })),
    editorPermissions: { ...defaultSettings.editorPermissions },
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringSetting(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function optionSetting(value: unknown, options: string[], fallback: string) {
  return typeof value === "string" && options.includes(value) ? value : fallback;
}

function colorSetting(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function mergeSettings(stored: Partial<SettingsState>): SettingsState {
  const r = isPlainRecord(stored) ? stored : {};
  return {
    ...defaultSettings,
    studioName: stringSetting(r.studioName, defaultSettings.studioName),
    profileName: stringSetting(r.profileName, defaultSettings.profileName),
    profileTitle: stringSetting(r.profileTitle, defaultSettings.profileTitle),
    profileBio: stringSetting(r.profileBio, defaultSettings.profileBio),
    profileLocation: stringSetting(r.profileLocation, defaultSettings.profileLocation),
    timeZone: optionSetting(r.timeZone, ["Asia/Dubai", "Pacific Time", "Eastern Time", "UTC"], defaultSettings.timeZone),
    dateFormat: optionSetting(r.dateFormat, ["May 22, 2025", "22 May 2025", "2025-05-22"], defaultSettings.dateFormat),
    weekStart: optionSetting(r.weekStart, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], defaultSettings.weekStart),
    teamRole: optionSetting(r.teamRole, teamRoleOptions, defaultSettings.teamRole),
    theme: optionSetting(r.theme, ["Light", "Dark", "System"], defaultSettings.theme),
    accentColor: colorSetting(r.accentColor, defaultSettings.accentColor),
    density: optionSetting(r.density, ["Comfortable", "Compact"], defaultSettings.density),
    projectStages: Array.isArray(r.projectStages) ? r.projectStages.filter((s): s is string => typeof s === "string" && !!s.trim()) : defaultSettings.projectStages,
    teamMembers: Array.isArray(r.teamMembers) ? r.teamMembers.filter((m: unknown): m is TeamMember => isPlainRecord(m) && typeof (m as TeamMember).name === "string") : defaultSettings.teamMembers,
    notifications: { ...defaultSettings.notifications, ...(isPlainRecord(r.notifications) ? r.notifications : {}) },
    integrations: { ...defaultSettings.integrations, ...(isPlainRecord(r.integrations) ? r.integrations : {}) },
    integrationAccounts: { ...defaultSettings.integrationAccounts, ...(isPlainRecord(r.integrationAccounts) ? r.integrationAccounts : {}) },
    editorPermissions: { ...defaultSettings.editorPermissions, ...(isPlainRecord(r.editorPermissions) ? r.editorPermissions : {}) },
  };
}

function readInitialSettings(): SettingsState {
  if (typeof window === "undefined") return freshDefaultSettings();
  return mergeSettings(readJson<Partial<SettingsState>>(SETTINGS_STORAGE_KEY, {}));
}

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function iso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isDoneStatus(status: string) {
  return ["delivered", "done", "paid", "published", "closed", "archived", "shipped", "completed", "released"].some(
    (w) => status.toLowerCase().includes(w),
  );
}

interface DataContextValue {
  items: WorkItem[];
  setItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  salaryBatches: SalaryBatch[];
  reconcileSalaryBatches: (items: WorkItem[]) => void;
  isSignedIn: boolean;
  isAuthLoaded: boolean;
  toast: ToastState | null;
  setToast: React.Dispatch<React.SetStateAction<ToastState | null>>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user, isLoaded: clerkLoaded } = useUser();
  const [items, setItemsState] = useState<WorkItem[]>([]);
  const [settings, setSettingsState] = useState<SettingsState>(() => readInitialSettings());
  const [salaryBatches, setSalaryBatches] = useState<SalaryBatch[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const migrationDone = useRef(false);

  // Always call hooks — Convex handles unauthenticated state gracefully
  const convexItems = useQuery(api.workItems.list, {});
  const convexSettings = useQuery(api.settings.get, {});
  const convexBatches = useQuery(api.salaryBatches.list, {});
  const replaceAllItems = useMutation(api.workItems.replaceAll);
  const upsertSettings = useMutation(api.settings.upsert);
  const replaceAllBatches = useMutation(api.salaryBatches.replaceAll);

  // Guest mode: load from localStorage
  useEffect(() => {
    if (!clerkLoaded) return;
    if (isSignedIn) return;

    const stored = readJson<WorkItem[]>(STORAGE_KEY, []);
    setItemsState(stored);
    setSettingsState(readInitialSettings());

    const salState = readJson<SalaryState>(SALARY_STORAGE_KEY, { batches: [] });
    setSalaryBatches(salState.batches);
    setReady(true);
  }, [clerkLoaded, isSignedIn]);

  // Signed-in mode: initialise from Convex, migrate if needed
  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;
    if (convexItems === undefined || convexSettings === undefined || convexBatches === undefined) return;
    if (migrationDone.current) return;
    migrationDone.current = true;

    const hasConvexData = convexItems.length > 0 || convexSettings !== null;
    if (!hasConvexData) {
      const localItems = readJson<WorkItem[]>(STORAGE_KEY, []);
      const localSettings = readJson<Partial<SettingsState>>(SETTINGS_STORAGE_KEY, {});
      const localBatches = readJson<SalaryState>(SALARY_STORAGE_KEY, { batches: [] });

      if (localItems.length > 0) {
        replaceAllItems({ items: localItems });
        removeKey(STORAGE_KEY);
      }
      if (localBatches.batches.length > 0) {
        replaceAllBatches({ batches: localBatches.batches });
        removeKey(SALARY_STORAGE_KEY);
      }
      if (Object.keys(localSettings).length > 0) {
        const merged = mergeSettings(localSettings);
        upsertSettings(merged);
        removeKey(SETTINGS_STORAGE_KEY);
      }
    }

    setItemsState(convexItems);
    setSettingsState(convexSettings ?? readInitialSettings());
    setSalaryBatches(convexBatches);
    setReady(true);
  }, [clerkLoaded, isSignedIn, convexItems, convexSettings, convexBatches, replaceAllItems, replaceAllBatches, upsertSettings]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Unified items setter
  const setItems = useCallback(
    (updater: React.SetStateAction<WorkItem[]>) => {
      setItemsState((prev: WorkItem[]) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (isSignedIn) {
          replaceAllItems({ items: next }).catch(() => {});
        } else {
          writeJson(STORAGE_KEY, next);
        }
        return next;
      });
    },
    [isSignedIn, replaceAllItems],
  );

  // Unified settings setter
  const setSettings = useCallback(
    (updater: React.SetStateAction<SettingsState>) => {
      setSettingsState((prev: SettingsState) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (isSignedIn) {
          upsertSettings(next).catch(() => {});
        } else {
          writeJson(SETTINGS_STORAGE_KEY, next);
        }
        return next;
      });
    },
    [isSignedIn, upsertSettings],
  );

  const reconcileSalaryBatches = useCallback(
    (workItems: WorkItem[]) => {
      const completedBatchCount = Math.floor(
        workItems.filter((w) => w.workType === "Job / Salary" && isDoneStatus(w.status)).length / 20,
      );
      setSalaryBatches((prev: SalaryBatch[]) => {
        if (prev.length >= completedBatchCount) return prev;
        const next = [...prev];
        while (next.length < completedBatchCount) {
          const n = next.length + 1;
          next.push({
            id: `batch-${n}`,
            number: n,
            completedDate: iso(todayDate()),
            archived: false,
            archivedDate: "",
          });
        }
        if (isSignedIn) {
          replaceAllBatches({ batches: next }).catch(() => {});
        } else {
          writeJson(SALARY_STORAGE_KEY, { batches: next });
        }
        return next;
      });
    },
    [isSignedIn, replaceAllBatches],
  );

  const value: DataContextValue = {
    items,
    setItems,
    settings,
    setSettings,
    salaryBatches,
    reconcileSalaryBatches,
    isSignedIn: !!isSignedIn,
    isAuthLoaded: clerkLoaded && ready,
    toast,
    setToast,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
