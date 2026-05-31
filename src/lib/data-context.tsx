"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { WorkItem, SettingsState, SalaryBatch, SalaryState, TeamMember, IntegrationConfig } from "./types";

const STORAGE_KEY = "video-editing-work-tracker:v1";
const SALARY_STORAGE_KEY = "video-editing-work-tracker:salary-batches:v1";
const SETTINGS_STORAGE_KEY = "video-editing-work-tracker:settings:v1";

type ToastState = { message: string; tone: "success" | "info" | "warning" };

const teamRoleOptions = ["Owner", "Editor", "Reviewer", "Client"];
const LEGACY_DEMO_SETTINGS = {
  studioName: "CutLab Studio",
  profileName: "Jordan Lee",
  profileUsername: "jordanlee",
  profileTitle: "Video Editor & Storyteller",
  profileBio: "Clean, cinematic edits for creators, campaigns, and client stories.",
  profileLocation: "Los Angeles, CA",
};

const permissionKeys = [
  "Create and edit projects",
  "Upload media and assets",
  "Manage project stages",
  "Invite team members",
  "Manage app settings",
];

const defaultRolePermissions: Record<string, Record<string, boolean>> = {
  Owner: Object.fromEntries(permissionKeys.map((k) => [k, true])),
  Editor: Object.fromEntries(permissionKeys.map((k) => [k, ["Create and edit projects", "Upload media and assets"].includes(k)])),
  Reviewer: Object.fromEntries(permissionKeys.map((k) => [k, false])),
  Client: Object.fromEntries(permissionKeys.map((k) => [k, false])),
};

const emptyIntegrationConfig: IntegrationConfig = {
  connected: false,
  account: "",
  folder: "",
  channel: "",
  workspace: "",
  webhookUrl: "",
  connectedAt: "",
  lastSyncAt: "",
};

const integrationNames = ["Google Drive", "Dropbox", "Slack", "Frame.io"];

const defaultIntegrationConfigs: Record<string, IntegrationConfig> = Object.fromEntries(
  integrationNames.map((name) => [name, { ...emptyIntegrationConfig }]),
);

const defaultSettings: SettingsState = {
  studioName: "CutLab Studio",
  profileName: "Your Profile",
  profileUsername: "editor",
  profileTitle: "Video Editor",
  profileBio: "Track active edits, delivery dates, feedback, and salary batches in one focused workspace.",
  profileLocation: "Local workspace",
  profileImageUrl: "",
  timeZone: "Asia/Dubai",
  dateFormat: "Month Day, Year",
  weekStart: "Mon",
  currencyCode: "INR",
  projectStages: ["Planned", "In Progress", "Client Review", "Delivered"],
  notifications: {
    "Project updates": false,
    "Feedback received": false,
    "Upcoming deadlines": false,
    Mentions: false,
    "Weekly summary": false,
  },
  integrations: {
    "Google Drive": false,
    Dropbox: false,
    Slack: false,
    "Frame.io": false,
  },
  integrationAccounts: {
    "Google Drive": "",
    Dropbox: "",
    Slack: "",
    "Frame.io": "",
  },
  integrationConfigs: { ...defaultIntegrationConfigs },
  teamRole: "Editor",
  teamMembers: [],
  editorPermissions: {
    "Create and edit projects": false,
    "Upload media and assets": false,
    "Manage project stages": false,
    "Invite team members": false,
    "Manage app settings": false,
  },
  rolePermissions: JSON.parse(JSON.stringify(defaultRolePermissions)),
  theme: "Light",
  accentColor: "#5b3fa0",
  density: "Comfortable",
};

function isLegacyDemoSettings(value: unknown) {
  if (!isPlainRecord(value)) return false;
  return (
    value.studioName === LEGACY_DEMO_SETTINGS.studioName &&
    value.profileName === LEGACY_DEMO_SETTINGS.profileName &&
    value.profileUsername === LEGACY_DEMO_SETTINGS.profileUsername &&
    value.profileTitle === LEGACY_DEMO_SETTINGS.profileTitle &&
    value.profileBio === LEGACY_DEMO_SETTINGS.profileBio &&
    value.profileLocation === LEGACY_DEMO_SETTINGS.profileLocation
  );
}

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
    integrationConfigs: JSON.parse(JSON.stringify(defaultIntegrationConfigs)),
    teamMembers: defaultSettings.teamMembers.map((m: TeamMember) => ({ ...m })),
    editorPermissions: { ...defaultSettings.editorPermissions },
    rolePermissions: JSON.parse(JSON.stringify(defaultRolePermissions)),
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

function booleanRecordSetting(value: unknown, fallback: Record<string, boolean>) {
  const record = { ...fallback };
  if (!isPlainRecord(value)) return record;
  for (const key of Object.keys(record)) {
    if (typeof value[key] === "boolean") {
      record[key] = value[key];
    }
  }
  return record;
}

function stringRecordSetting(value: unknown, fallback: Record<string, string>) {
  const record = { ...fallback };
  if (!isPlainRecord(value)) return record;
  for (const key of Object.keys(record)) {
    if (typeof value[key] === "string") {
      record[key] = value[key].trim();
    }
  }
  return record;
}

function normalizeStoredItem(value: unknown): WorkItem | null {
  if (!isPlainRecord(value)) return null;
  const id = typeof value.id === "string" && value.id.trim() ? value.id : "";
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : "";
  if (!id || !title) return null;
  return {
    id,
    profileId: stringSetting(value.profileId, "video-editing"),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
    title,
    client: typeof value.client === "string" ? value.client : "",
    status: stringSetting(value.status, "Planned"),
    workType: stringSetting(value.workType, "Job / Salary"),
    startDate: stringSetting(value.startDate, iso(todayDate())),
    dueDate: stringSetting(value.dueDate, iso(todayDate())),
    earnings: typeof value.earnings === "number" && Number.isFinite(value.earnings) ? Math.max(0, value.earnings) : 0,
    notes: typeof value.notes === "string" ? value.notes : "",
  };
}

function normalizeSalaryState(value: unknown): SalaryState {
  const batches = isPlainRecord(value) && Array.isArray(value.batches) ? value.batches : [];
  return {
    batches: batches.flatMap((batch, index): SalaryBatch[] => {
      if (!isPlainRecord(batch)) return [];
      const number = typeof batch.number === "number" && Number.isFinite(batch.number) ? Math.max(1, Math.floor(batch.number)) : index + 1;
      return [{
        id: typeof batch.id === "string" && batch.id.trim() ? batch.id : `batch-${number}`,
        number,
        completedDate: stringSetting(batch.completedDate, iso(todayDate())),
        archived: typeof batch.archived === "boolean" ? batch.archived : false,
        archivedDate: typeof batch.archivedDate === "string" ? batch.archivedDate : "",
      }];
    }),
  };
}

function normalizeIntegrationConfig(value: unknown): IntegrationConfig {
  if (!isPlainRecord(value)) return { ...emptyIntegrationConfig };
  return {
    connected: typeof value.connected === "boolean" ? value.connected : false,
    account: typeof value.account === "string" ? value.account.trim() : "",
    folder: typeof value.folder === "string" ? value.folder.trim() : "",
    channel: typeof value.channel === "string" ? value.channel.trim() : "",
    workspace: typeof value.workspace === "string" ? value.workspace.trim() : "",
    webhookUrl: typeof value.webhookUrl === "string" ? value.webhookUrl.trim() : "",
    connectedAt: typeof value.connectedAt === "string" ? value.connectedAt : "",
    lastSyncAt: typeof value.lastSyncAt === "string" ? value.lastSyncAt : "",
  };
}

function normalizeIntegrationConfigs(value: unknown, legacyIntegrations?: unknown, legacyAccounts?: unknown): Record<string, IntegrationConfig> {
  const configs: Record<string, IntegrationConfig> = {};
  for (const name of integrationNames) {
    configs[name] = { ...emptyIntegrationConfig };
  }

  // Merge from new integrationConfigs if present
  if (isPlainRecord(value)) {
    for (const name of integrationNames) {
      if (isPlainRecord(value[name])) {
        configs[name] = normalizeIntegrationConfig(value[name]);
      }
    }
  }

  // Migrate from legacy integrations + integrationAccounts if new configs are all empty
  const allEmpty = Object.values(configs).every((c) => !c.connected && !c.account);
  if (allEmpty && isPlainRecord(legacyIntegrations) && isPlainRecord(legacyAccounts)) {
    for (const name of integrationNames) {
      const wasConnected = legacyIntegrations[name] === true;
      const account = typeof legacyAccounts[name] === "string" ? (legacyAccounts[name] as string).trim() : "";
      if (wasConnected || account) {
        configs[name] = { ...emptyIntegrationConfig, connected: wasConnected, account, connectedAt: wasConnected ? new Date().toISOString() : "" };
      }
    }
  }

  return configs;
}

function normalizeRolePermissions(value: unknown, legacyEditorPerms?: unknown): Record<string, Record<string, boolean>> {
  const result: Record<string, Record<string, boolean>> = JSON.parse(JSON.stringify(defaultRolePermissions));

  if (isPlainRecord(value)) {
    for (const role of teamRoleOptions) {
      if (isPlainRecord(value[role])) {
        const rolePerms: Record<string, boolean> = {};
        for (const perm of permissionKeys) {
          rolePerms[perm] = typeof (value[role] as Record<string, unknown>)[perm] === "boolean" ? (value[role] as Record<string, unknown>)[perm] as boolean : defaultRolePermissions[role]?.[perm] ?? false;
        }
        result[role] = rolePerms;
      }
    }
    return result;
  }

  // Migrate from legacy flat editorPermissions → apply them as Editor role
  if (isPlainRecord(legacyEditorPerms)) {
    const editorPerms: Record<string, boolean> = {};
    for (const perm of permissionKeys) {
      editorPerms[perm] = typeof legacyEditorPerms[perm] === "boolean" ? legacyEditorPerms[perm] as boolean : defaultRolePermissions.Editor?.[perm] ?? false;
    }
    result.Editor = editorPerms;
  }

  return result;
}

function mergeSettings(stored: Partial<SettingsState>): SettingsState {
  const r = isPlainRecord(stored) ? stored : {};
  return {
    ...defaultSettings,
    studioName: stringSetting(r.studioName, defaultSettings.studioName),
    profileName: stringSetting(r.profileName, defaultSettings.profileName),
    profileUsername: stringSetting(r.profileUsername, defaultSettings.profileUsername),
    profileTitle: stringSetting(r.profileTitle, defaultSettings.profileTitle),
    profileBio: stringSetting(r.profileBio, defaultSettings.profileBio),
    profileLocation: stringSetting(r.profileLocation, defaultSettings.profileLocation),
    profileImageUrl: typeof r.profileImageUrl === "string" ? r.profileImageUrl.trim() : defaultSettings.profileImageUrl,
    timeZone: optionSetting(r.timeZone, ["UTC", "Pacific Time", "Eastern Time", "Asia/Dubai"], defaultSettings.timeZone),
    dateFormat: optionSetting(r.dateFormat, ["Month Day, Year", "Day Month Year", "YYYY-MM-DD"], defaultSettings.dateFormat),
    weekStart: optionSetting(r.weekStart, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], defaultSettings.weekStart),
    currencyCode: optionSetting(r.currencyCode, ["USD", "EUR", "GBP", "INR", "AED", "SAR"], defaultSettings.currencyCode),
    teamRole: optionSetting(r.teamRole, teamRoleOptions, defaultSettings.teamRole),
    theme: optionSetting(r.theme, ["Light", "Dark", "System"], defaultSettings.theme),
    accentColor: colorSetting(r.accentColor, defaultSettings.accentColor),
    density: optionSetting(r.density, ["Comfortable", "Compact"], defaultSettings.density),
    projectStages: Array.isArray(r.projectStages)
      ? r.projectStages.flatMap((s): string[] => (typeof s === "string" && s.trim() ? [s.trim()] : []))
      : defaultSettings.projectStages,
    teamMembers: Array.isArray(r.teamMembers)
      ? r.teamMembers.flatMap((m: unknown): TeamMember[] => {
          if (!isPlainRecord(m) || typeof m.name !== "string" || !m.name.trim()) return [];
          return [{
            id: typeof m.id === "string" && m.id.trim() ? m.id : `member-${m.name.trim().toLowerCase().replace(/\s+/g, "-")}`,
            name: m.name.trim(),
            role: optionSetting(m.role, teamRoleOptions, "Editor"),
            email: typeof m.email === "string" ? m.email.trim() : "",
          }];
        })
      : defaultSettings.teamMembers,
    notifications: booleanRecordSetting(r.notifications, defaultSettings.notifications),
    integrations: booleanRecordSetting(r.integrations, defaultSettings.integrations),
    integrationAccounts: stringRecordSetting(r.integrationAccounts, defaultSettings.integrationAccounts),
    integrationConfigs: normalizeIntegrationConfigs(r.integrationConfigs, r.integrations, r.integrationAccounts),
    editorPermissions: booleanRecordSetting(r.editorPermissions, defaultSettings.editorPermissions),
    rolePermissions: normalizeRolePermissions(r.rolePermissions, r.editorPermissions),
  };
}

function readInitialSettings(): SettingsState {
  if (typeof window === "undefined") return freshDefaultSettings();
  const stored = readJson<Partial<SettingsState>>(SETTINGS_STORAGE_KEY, {});
  if (isLegacyDemoSettings(stored)) {
    removeKey(SETTINGS_STORAGE_KEY);
    return freshDefaultSettings();
  }
  return mergeSettings(stored);
}

function readInitialItems(): WorkItem[] {
  if (typeof window === "undefined") return [];
  const stored = readJson<unknown>(STORAGE_KEY, []);
  const storedItems = Array.isArray(stored) ? stored : [];
  return storedItems.flatMap((item) => {
    const normalized = normalizeStoredItem(item);
    return normalized ? [normalized] : [];
  });
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

function readObjectString(value: unknown, key: string) {
  if (!value || typeof value !== "object") return "";
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" ? candidate : "";
}

function readFirstObjectString(value: unknown, keys: string[]) {
  for (const key of keys) {
    const candidate = readObjectString(value, key).trim();
    if (candidate) return candidate;
  }
  return "";
}

function isGitHubExternalAccount(value: unknown) {
  const providerText = [
    readObjectString(value, "provider"),
    readObjectString(value, "providerId"),
    readObjectString(value, "strategy"),
  ].join(" ").toLowerCase();
  return providerText.includes("github");
}

function deriveAuthProfile(user: ReturnType<typeof useUser>["user"]) {
  if (!user) {
    return { profileName: "", profileUsername: "", profileImageUrl: "" };
  }

  const externalAccountsRaw = (user as unknown as { externalAccounts?: unknown[] }).externalAccounts;
  const externalAccounts = Array.isArray(externalAccountsRaw) ? externalAccountsRaw : [];
  const githubAccount = externalAccounts.find(isGitHubExternalAccount);

  const profileName =
    readFirstObjectString(githubAccount, ["name", "fullName", "displayName"]) ||
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username?.trim() ||
    "";
  const profileUsername =
    readFirstObjectString(githubAccount, ["username", "login", "screenName", "externalId", "providerUserId"]) ||
    user.username?.trim() ||
    "";
  const profileImageUrl =
    readFirstObjectString(githubAccount, ["imageUrl", "avatarUrl", "picture", "profileImageUrl"]) ||
    user.imageUrl?.trim() ||
    "";

  return { profileName, profileUsername, profileImageUrl };
}

function shouldUseAuthProfileValue(field: keyof Pick<SettingsState, "profileName" | "profileUsername" | "profileImageUrl">, current: string, authValue: string) {
  const trimmed = current.trim();
  const legacyValue = field === "profileImageUrl" ? "" : LEGACY_DEMO_SETTINGS[field];
  if (!authValue.trim()) return false;
  if (!trimmed) return true;
  if (trimmed === defaultSettings[field]) return true;
  if (legacyValue && trimmed === legacyValue) return true;
  return false;
}

interface DataContextValue {
  items: WorkItem[];
  setItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  salaryBatches: SalaryBatch[];
  reconcileSalaryBatches: (items: WorkItem[]) => void;
  isAuthEnabled: boolean;
  isSignedIn: boolean;
  isAuthLoaded: boolean;
  toast: ToastState | null;
  setToast: React.Dispatch<React.SetStateAction<ToastState | null>>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children, mode = "local" }: { children: React.ReactNode; mode?: "local" | "cloud" }) {
  if (mode === "cloud") {
    return <CloudDataProvider>{children}</CloudDataProvider>;
  }
  return <LocalDataProvider>{children}</LocalDataProvider>;
}

function LocalDataProvider({ children }: { children: React.ReactNode }) {
  const [items, setItemsState] = useState<WorkItem[]>([]);
  const [settings, setSettingsState] = useState<SettingsState>(() => readInitialSettings());
  const [salaryBatches, setSalaryBatches] = useState<SalaryBatch[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    setItemsState(readInitialItems());
    setSettingsState(readInitialSettings());
    setSalaryBatches(normalizeSalaryState(readJson<unknown>(SALARY_STORAGE_KEY, { batches: [] })).batches);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const setItems = useCallback((updater: React.SetStateAction<WorkItem[]>) => {
    setItemsState((prev: WorkItem[]) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeJson(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const setSettings = useCallback((updater: React.SetStateAction<SettingsState>) => {
    setSettingsState((prev: SettingsState) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeJson(SETTINGS_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const reconcileSalaryBatches = useCallback((workItems: WorkItem[]) => {
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
      writeJson(SALARY_STORAGE_KEY, { batches: next });
      return next;
    });
  }, []);

  const value: DataContextValue = {
    items,
    setItems,
    settings,
    setSettings,
    salaryBatches,
    reconcileSalaryBatches,
    isAuthEnabled: false,
    isSignedIn: false,
    isAuthLoaded: true,
    toast,
    setToast,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function CloudDataProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user, isLoaded: clerkLoaded } = useUser();
  const [items, setItemsState] = useState<WorkItem[]>([]);
  const [settings, setSettingsState] = useState<SettingsState>(() => readInitialSettings());
  const [salaryBatches, setSalaryBatches] = useState<SalaryBatch[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const initializationToken = useRef(0);

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

    const stored = readInitialItems();
    setItemsState(stored);
    setSettingsState(readInitialSettings());

    const salState = normalizeSalaryState(readJson<unknown>(SALARY_STORAGE_KEY, { batches: [] }));
    setSalaryBatches(salState.batches);
    setReady(true);
  }, [clerkLoaded, isSignedIn]);

  // Signed-in mode: initialise from Convex, migrate if needed
  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;
    if (convexItems === undefined || convexSettings === undefined || convexBatches === undefined) return;
    if (ready) return;

    const loadedItems = convexItems;
    const loadedSettings = convexSettings;
    const loadedBatches = convexBatches;
    let cancelled = false;
    const token = initializationToken.current + 1;
    initializationToken.current = token;

    async function initializeCloudData() {
      const localItems = readInitialItems();
      const localSettings = readJson<Partial<SettingsState>>(SETTINGS_STORAGE_KEY, {});
      const localBatches = normalizeSalaryState(readJson<unknown>(SALARY_STORAGE_KEY, { batches: [] }));
      const mergedLocalSettings = Object.keys(localSettings).length > 0 ? mergeSettings(localSettings) : readInitialSettings();
      let nextItems: WorkItem[] = loadedItems;
      let nextSettings = loadedSettings ? mergeSettings(loadedSettings) : mergedLocalSettings;
      let nextBatches: SalaryBatch[] = loadedBatches;
      let syncFailed = false;

      if (loadedItems.length === 0 && localItems.length > 0) {
        try {
          await replaceAllItems({ items: localItems });
          removeKey(STORAGE_KEY);
          nextItems = localItems;
        } catch {
          syncFailed = true;
          nextItems = localItems;
        }
      }

      if (loadedBatches.length === 0 && localBatches.batches.length > 0) {
        try {
          await replaceAllBatches({ batches: localBatches.batches });
          removeKey(SALARY_STORAGE_KEY);
          nextBatches = localBatches.batches;
        } catch {
          syncFailed = true;
          nextBatches = localBatches.batches;
        }
      }

      if (!loadedSettings && Object.keys(localSettings).length > 0) {
        try {
          await upsertSettings(mergedLocalSettings);
          removeKey(SETTINGS_STORAGE_KEY);
          nextSettings = mergedLocalSettings;
        } catch {
          syncFailed = true;
          nextSettings = mergedLocalSettings;
        }
      }

      if (syncFailed) {
        if (!cancelled) {
          setToast({
            tone: "warning",
            message: "Cloud sync is not available. Your data is still saved on this device.",
          });
        }
      }

      if (cancelled || initializationToken.current !== token) return;
      setItemsState(nextItems);
      setSettingsState(nextSettings);
      setSalaryBatches(nextBatches);
      setReady(true);
    }

    void initializeCloudData();
    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, isSignedIn, ready, convexItems, convexSettings, convexBatches, replaceAllItems, replaceAllBatches, upsertSettings]);

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn || !user || !ready) return;

    const authProfile = deriveAuthProfile(user);
    if (!authProfile.profileName && !authProfile.profileUsername && !authProfile.profileImageUrl) return;

    setSettingsState((current) => {
      const next: SettingsState = {
        ...current,
        profileName: shouldUseAuthProfileValue("profileName", current.profileName, authProfile.profileName)
          ? authProfile.profileName
          : current.profileName,
        profileUsername: shouldUseAuthProfileValue("profileUsername", current.profileUsername, authProfile.profileUsername)
          ? authProfile.profileUsername
          : current.profileUsername,
        profileImageUrl: shouldUseAuthProfileValue("profileImageUrl", current.profileImageUrl, authProfile.profileImageUrl)
          ? authProfile.profileImageUrl
          : current.profileImageUrl,
      };

      const changed =
        next.profileName !== current.profileName ||
        next.profileUsername !== current.profileUsername ||
        next.profileImageUrl !== current.profileImageUrl;

      if (changed) {
        upsertSettings(next).catch(() => {
          writeJson(SETTINGS_STORAGE_KEY, next);
        });
      }

      return changed ? next : current;
    });
  }, [clerkLoaded, isSignedIn, ready, upsertSettings, user]);

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
          replaceAllItems({ items: next }).catch(() => {
            writeJson(STORAGE_KEY, next);
            setToast({
              tone: "warning",
              message: "Cloud sync failed. Projects are saved locally for now.",
            });
          });
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
          upsertSettings(next).catch(() => {
            writeJson(SETTINGS_STORAGE_KEY, next);
            setToast({
              tone: "warning",
              message: "Cloud sync failed. Settings are saved locally for now.",
            });
          });
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
          replaceAllBatches({ batches: next }).catch(() => {
            writeJson(SALARY_STORAGE_KEY, { batches: next });
            setToast({
              tone: "warning",
              message: "Cloud sync failed. Salary batches are saved locally for now.",
            });
          });
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
    isAuthEnabled: true,
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
