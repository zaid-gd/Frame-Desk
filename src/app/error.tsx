"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 text-foreground">
      <section className="w-full max-w-[520px] rounded-lg border border-border bg-card p-6 text-card-foreground">
        <div className="space-y-4">
          <div>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-[26px] font-bold">
              Frame Desk needs a refresh
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The tracker hit an unexpected app error. Your saved projects stay in local browser storage.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} className="bg-[var(--app-accent)] text-[var(--app-accent-foreground)] hover:bg-[var(--app-highlight)]">
              Try Again
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[var(--app-border)] text-[var(--app-highlight)]"
            >
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
