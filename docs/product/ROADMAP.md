# CutLab Studio Roadmap

This roadmap describes planned directions, not shipped features or delivery commitments. Priorities may change as the product and contributor needs become clearer. See the README's Feature Status table for what is available today.

## Phase 1: Developer Onboarding And Documentation

- Keep local setup, environment variables, architecture notes, and contributor guidance current.
- Add Playwright end-to-end tests for core authenticated and client-facing workflows.
- Document repeatable test data and local verification flows.

## Phase 2: Client Portal Hardening

- Add optional portal expiry controls.
- Add optional password protection for shared portal links.
- Expand portal access, privacy, and revision-flow coverage.

## Phase 3: Editing-Specific Workflow Features

- Add timecode-based feedback for precise review notes.
- Materialize template deliverables and checklists into actionable project setup items.
- Improve review-round and delivery-state workflows around video-specific handoffs.

## Phase 4: Integrations

- Add Google Drive OAuth and API synchronization for project files and folders.
- Add Frame.io OAuth and API synchronization for review assets, comments, and approvals.
- Release the prepared Cloudflare R2 storage provider for large project uploads after deployment and CORS validation.
- Preserve the provider-neutral file model so integrations remain optional.

## Phase 5: Billing, Reporting, And Studio Operations

- Add editor payout reports based on delivered work and salary batches.
- Add payment collection and accounting sync for client invoices after provider account setup and security review.
- Expand operational reporting without exposing private financial data in client-facing views.
