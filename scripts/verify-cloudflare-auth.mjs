import { chromium } from "@playwright/test";

const baseUrl = process.env.FRAME_DESK_VERIFY_URL?.replace(/\/$/, "");
const accessPassword = process.env.FRAME_DESK_ACCESS_PASSWORD;

if (!baseUrl || !accessPassword) {
  console.error("Set FRAME_DESK_VERIFY_URL and FRAME_DESK_ACCESS_PASSWORD before running the Cloudflare auth check.");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  if (new URL(page.url()).pathname === "/access") {
    const accessResponse = await page.request.post(`${baseUrl}/api/access`, {
      data: { password: accessPassword },
      headers: { "Sec-Fetch-Site": "same-origin" },
    });
    if (!accessResponse.ok()) {
      throw new Error(`Access wall verification returned ${accessResponse.status()}.`);
    }
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  }

  const signIn = page.getByRole("button", { name: "Sign in", exact: true });
  await signIn.waitFor({ state: "visible" });
  await signIn.click();

  const unavailable = page.getByText(/Sign-in is unavailable until Clerk/);
  const clerkModal = page.locator('[class*="cl-modalBackdrop"]');

  await Promise.race([
    unavailable.waitFor({ state: "visible", timeout: 10_000 }).then(() => {
      throw new Error("Cloudflare account sign-in is disabled by incomplete public runtime configuration.");
    }),
    clerkModal.waitFor({ state: "visible", timeout: 10_000 }),
  ]);

  console.log(`Cloudflare Clerk sign-in opened successfully at ${baseUrl}.`);
} finally {
  await browser.close();
}
