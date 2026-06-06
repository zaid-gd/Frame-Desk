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
import type * as projectActivity from "../projectActivity.js";
import type * as projectFiles from "../projectFiles.js";
import type * as publicProfiles from "../publicProfiles.js";
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
  projectActivity: typeof projectActivity;
  projectFiles: typeof projectFiles;
  publicProfiles: typeof publicProfiles;
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

export declare const components: {};
