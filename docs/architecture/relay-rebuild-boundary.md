# Relay rebuild boundary

Status: accepted

Date: 2026-08-14

## Decision

Build Relay beside the current product. Do not change a deployed route, product name, user-facing screen, or old data path until the full rebuild has passed its release checks and the product owner approves the cutover.

Relay features use this boundary:

1. A Next.js route composes a route-facing application controller with a presentation-only screen.
2. The controller returns a display-ready model and semantic actions. It owns product wording, state mapping, permission-aware action choices, and user-facing error results.
3. The controller uses capability-specific ports whose operations describe product uses rather than database create, read, update, and delete calls.
4. Local, sample, Convex, and in-memory adapters implement the same port contract. Local owns browser storage, sample stays read-only, Convex owns cloud calls and subscriptions, and in-memory supports tests.
5. The screen renders the model and invokes semantic actions. It does not import Convex, Clerk, storage code, generated backend references, raw network errors, or domain mutation rules.

Pure domain modules hold terms, rules, and calculations. They do not import React, Next.js, Convex, Clerk, or presentation code. This record applies the accepted seams in [design-system-application-convex-seams.md](./design-system-application-convex-seams.md) to the Relay rebuild.

## Clean-start cloud data

Relay uses new Convex tables and functions with new names and meanings. Relay code must not read, show, copy, migrate, update, or delete any old table or record. Old cloud data stays intact and outside the replacement.

Any future migration, merge, or cleanup needs its own approved work. Local Mode import may write a versioned local backup into an empty Relay cloud Workspace when that later feature is approved; it is not an old-cloud-data migration.

## Build and release boundary

- Work stays on the shared `feat/relay-rebuild` branch.
- Each ticket may make small commits on that branch but must not open its own pull request.
- Partial Relay screens must not replace or alter the deployed product.
- Do not add a private legacy route or deploy a partial rebuild.
- The full rebuild will use one cutover pull request after all release checks pass.

For ticket 01, only records that set the product language and rebuild boundary may change. No runtime route, screen, schema, function, or deployment setting changes.

## Name-clearance risk

The product owner accepted Relay as the rebuild name while another creative-workflow product uses the same name. This creates brand and search risk. The choice does not grant legal, trademark, domain, company-name, or app-store clearance. Complete those checks before a public launch; legal clearance is outside the rebuild scope.

## Consequences

- New code and UI use the terms in the root `CONTEXT.md` glossary.
- Old and new cloud meanings cannot mix through shared tables or fallback reads.
- Screens can run against fixed controller models without cloud or browser storage.
- Controller and adapter tests can use the in-memory implementation of the same capability port.
- The current deployed experience remains unchanged while Relay grows beside it.
