/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clientPortals from "../clientPortals.js";
import type * as domainValidators from "../domainValidators.js";
import type * as http from "../http.js";
import type * as projectActivity from "../projectActivity.js";
import type * as projectFiles from "../projectFiles.js";
import type * as publicProfiles from "../publicProfiles.js";
import type * as r2 from "../r2.js";
import type * as relayClientPortals from "../relayClientPortals.js";
import type * as relayClients from "../relayClients.js";
import type * as relayProjectFileAccess from "../relayProjectFileAccess.js";
import type * as relayProjectFiles from "../relayProjectFiles.js";
import type * as relayProjectOutputs from "../relayProjectOutputs.js";
import type * as relayProjects from "../relayProjects.js";
import type * as relaySalaryPlans from "../relaySalaryPlans.js";
import type * as relayStorageUsage from "../relayStorageUsage.js";
import type * as relayWorkflowTemplates from "../relayWorkflowTemplates.js";
import type * as relayWorkspaceImport from "../relayWorkspaceImport.js";
import type * as relayWorkspaceValidators from "../relayWorkspaceValidators.js";
import type * as resourceLinks from "../resourceLinks.js";
import type * as salaryBatches from "../salaryBatches.js";
import type * as settings from "../settings.js";
import type * as team from "../team.js";
import type * as workItems from "../workItems.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  clientPortals: typeof clientPortals;
  domainValidators: typeof domainValidators;
  http: typeof http;
  projectActivity: typeof projectActivity;
  projectFiles: typeof projectFiles;
  publicProfiles: typeof publicProfiles;
  r2: typeof r2;
  relayClientPortals: typeof relayClientPortals;
  relayClients: typeof relayClients;
  relayProjectFileAccess: typeof relayProjectFileAccess;
  relayProjectFiles: typeof relayProjectFiles;
  relayProjectOutputs: typeof relayProjectOutputs;
  relayProjects: typeof relayProjects;
  relaySalaryPlans: typeof relaySalaryPlans;
  relayStorageUsage: typeof relayStorageUsage;
  relayWorkflowTemplates: typeof relayWorkflowTemplates;
  relayWorkspaceImport: typeof relayWorkspaceImport;
  relayWorkspaceValidators: typeof relayWorkspaceValidators;
  resourceLinks: typeof resourceLinks;
  salaryBatches: typeof salaryBatches;
  settings: typeof settings;
  team: typeof team;
  workItems: typeof workItems;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  relayStorageUsage: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"relayStorageUsage">;
};
