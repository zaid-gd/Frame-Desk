# Contributing To CutLab Studio

Thank you for helping improve CutLab Studio. Keep changes focused, preserve the distinction between shipped and planned features, and include validation appropriate to the affected area.

## Requirements

- Node.js 22+
- npm
- A Convex account and development project
- A Clerk application

## Setup

```bash
git clone https://github.com/zaid-gd/Cutlab-Studio.git
cd Cutlab-Studio
npm ci
cp .env.example .env.local
npm run dev
```

Use your own development credentials in `.env.local`. Configure the Clerk issuer variable in the Convex development deployment as described in `.env.example`.

## Branches

Use a short, descriptive branch name. Suggested prefixes include:

- `feature/` for product work
- `fix/` for bug fixes
- `docs/` for documentation
- `test/` for test coverage

Examples: `feature/portal-expiry`, `fix/file-version-order`, or `docs/setup-guide`.

## Development

Run the Next.js app and Convex development deployment together:

```bash
npm run dev
```

Keep the change scoped, update tests and documentation when behavior changes, and avoid mixing unrelated formatting or refactors into the same pull request.

## Checks Before A Pull Request

Run the standard project check for every change:

```bash
npm run check
```

Run the full suite when changing Convex functions or schema, authentication, project files, team permissions, client portals, or application routes:

```bash
npm run check:full
```

Describe the checks you ran in the pull request. Include clear reproduction and verification steps for user-facing fixes.

## Code Style

- Follow the existing Next.js, React, TypeScript, Material UI, and Convex patterns.
- Keep TypeScript strict and avoid `any` where a precise type is available.
- Read `convex/_generated/ai/guidelines.md` before changing Convex code.
- Derive authorization from the authenticated Convex identity; do not trust client-provided user IDs.
- Keep public portal responses limited to explicit client-safe projections.
- Prefer small, focused changes and add comments only where the behavior is not self-explanatory.

## Secrets And Sensitive Data

- Never commit `.env.local`, API keys, tokens, credentials, production project IDs, client files, or personal data.
- Keep `.env.example` limited to empty or clearly fake placeholders.
- Use development Clerk and Convex projects for local testing.
- Report suspected vulnerabilities privately according to [SECURITY.md](SECURITY.md).
