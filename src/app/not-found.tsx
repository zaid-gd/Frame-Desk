"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 text-foreground">
      <section className="w-full max-w-[500px] rounded-lg border border-border bg-card p-6 text-card-foreground">
        <div className="space-y-4">
          <div>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-[26px] font-bold">Page not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This Frame Desk route does not exist. Return to the dashboard to keep tracking work.
            </p>
          </div>
          <Button asChild className="w-fit bg-[var(--app-accent)] text-[var(--app-accent-foreground)] hover:bg-[var(--app-highlight)]">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
