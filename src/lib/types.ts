export type EarningsMode = "manual" | "optional" | "batch" | "none";

export type WorkTypeConfig = {
  label: string;
  earningsMode: EarningsMode;
};

export type ProfileConfig = {
  id: string;
  name: string;
  headline: string;
  summary: string;
  workflow: string;
  titleLabel: string;
  unitLabel: string;
  itemLabel: string;
  statusLabel: string;
  workTypeLabel: string;
  startLabel: string;
  dueLabel: string;
  earningsLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  activeLabel: string;
  upcomingLabel: string;
  timelineTitle: string;
  conflictTitle: string;
  statusOptions: string[];
  typeOptions: WorkTypeConfig[];
  salaryBatch?: boolean;
  moneyLabel?: string;
};

export type WorkItem = {
  id: string;
  profileId: string;
  createdAt?: string;
  title: string;
  client?: string;
  status: string;
  workType: string;
  startDate: string;
  dueDate: string;
  earnings: number;
  notes: string;
};

export type SalaryBatch = {
  id: string;
  number: number;
  completedDate: string;
  archived: boolean;
  archivedDate: string;
};

export type SalaryState = {
  batches: SalaryBatch[];
};

export type Filters = {
  status: string;
  workType: string;
  from: string;
  to: string;
  earningsSort: "none" | "high" | "low";
  colorMode: "status" | "workType";
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
};

export type SettingsState = {
  studioName: string;
  profileName: string;
  profileUsername: string;
  profileTitle: string;
  profileBio: string;
  profileLocation: string;
  profileImageUrl: string;
  timeZone: string;
  dateFormat: string;
  weekStart: string;
  currencyCode: string;
  projectStages: string[];
  notifications: Record<string, boolean>;
  integrations: Record<string, boolean>;
  integrationAccounts: Record<string, string>;
  teamRole: string;
  teamMembers: TeamMember[];
  editorPermissions: Record<string, boolean>;
  theme: string;
  accentColor: string;
  density: string;
};
