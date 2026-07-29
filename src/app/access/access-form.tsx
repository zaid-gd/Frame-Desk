"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./access.module.css";

function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function AccessForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json() as { message?: string };

      if (!response.ok) {
        setMessage(result.message || "Access could not be verified.");
        return;
      }

      router.replace(safeReturnTo(returnTo ?? null));
      router.refresh();
    } catch {
      setMessage("Access could not be verified. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="access-password">Access password</label>
      <div className={styles.controls}>
        <input
          id="access-password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          maxLength={256}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby={message ? "access-message" : undefined}
          aria-invalid={message ? true : undefined}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Checking…" : "Continue"}
        </button>
      </div>
      <p
        id="access-message"
        className={styles.message}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  );
}
