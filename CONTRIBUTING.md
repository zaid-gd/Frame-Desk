# Contributing

## End-to-end tests

The Playwright suite uses Chromium and starts Next.js on `http://localhost:3000`,
or reuses an existing local server on that address.

Install the browser once:

```bash
npx playwright install chromium
```

Run the suite:

```bash
npm run test:e2e
```

Open a headed browser:

```bash
npm run test:e2e:headed
```

The app needs its normal public Clerk and Convex development variables to boot.
The local-mode project test does not create an authenticated session. The
authenticated project files, approvals, and client portal journey additionally
requires the Clerk secret:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CONVEX_URL`

The setup reuses `cutlab-e2e+clerk_test@example.com` in the Clerk development
instance. Override it with `E2E_CLERK_USER_EMAIL` when needed. The cloud test
uses unique project names and removes its project afterward.

Playwright writes failure traces, screenshots, and videos to `test-results/`.
Open the HTML report with:

```bash
npx playwright show-report
```
