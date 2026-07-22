"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Analytics = dynamic(() => import("@vercel/analytics/next").then((module) => module.Analytics), { ssr: false });
const SpeedInsights = dynamic(() => import("@vercel/speed-insights/next").then((module) => module.SpeedInsights), { ssr: false });

const consentKey = "cutlab-studio:privacy-consent:v1";
const preferencesEvent = "cutlab:open-privacy-preferences";

type ConsentChoice = "essential" | "analytics";

function storedChoice(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(consentKey);
    return value === "essential" || value === "analytics" ? value : null;
  } catch {
    return null;
  }
}

export function PrivacyControls() {
  const [choice, setChoice] = useState<ConsentChoice | null | undefined>(undefined);

  useEffect(() => {
    setChoice(storedChoice());
    const openPreferences = () => setChoice(null);
    window.addEventListener(preferencesEvent, openPreferences);
    return () => window.removeEventListener(preferencesEvent, openPreferences);
  }, []);

  const saveChoice = useCallback((nextChoice: ConsentChoice) => {
    try {
      window.localStorage.setItem(consentKey, nextChoice);
    } catch {
      // The preference remains valid for this session if storage is unavailable.
    }
    setChoice(nextChoice);
  }, []);

  return (
    <>
      {choice === "analytics" ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
      {choice === null ? (
        <section
          aria-label="Privacy preferences"
          className="fixed inset-x-3 bottom-[calc(80px+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-[760px] rounded-[10px] border border-[var(--app-strong-border)] bg-[var(--app-panel)] p-4 text-[var(--app-ink)] shadow-[var(--app-shadow-2)] sm:inset-x-5 lg:bottom-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">Choose your privacy settings</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                Essential storage keeps local work and sign-in sessions working. Optional usage and performance analytics help us improve the app. Read our{" "}
                <Link className="font-semibold text-[var(--app-highlight)] underline-offset-4 hover:underline" href="/privacy">
                  Privacy Policy
                </Link>.
              </p>
            </div>
            <div className="grid shrink-0 gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="min-h-12 rounded-md border border-[var(--app-strong-border)] bg-[var(--app-control)] px-4 text-sm font-semibold transition-colors hover:bg-[var(--app-soft-panel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)]"
                onClick={() => saveChoice("essential")}
              >
                Essential only
              </button>
              <button
                type="button"
                className="min-h-12 rounded-md bg-[var(--app-accent)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--app-highlight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)]"
                onClick={() => saveChoice("analytics")}
              >
                Allow analytics
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export function PrivacyPreferencesButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(preferencesEvent))}
    >
      Privacy choices
    </button>
  );
}
