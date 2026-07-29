import type { Metadata } from "next";
import { AccessForm } from "./access-form";
import styles from "./access.module.css";

export const metadata: Metadata = {
  title: "Private access | Frame Desk",
  description: "Enter the private access password to continue to Frame Desk.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;

  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.panel} aria-labelledby="access-heading">
        <div className={styles.wordmark} aria-label="Frame Desk">
          <span className={styles.mark} aria-hidden="true">F</span>
          <span>FRAME DESK</span>
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>PRIVATE PREVIEW</p>
          <h1 id="access-heading">This workspace is not public yet.</h1>
          <p>
            Frame Desk is in a limited preview while we finish the product and
            its legal review. Enter the shared access password to continue.
          </p>
        </div>

        <AccessForm returnTo={returnTo} />

        <p className={styles.note}>
          This access step is separate from your Frame Desk account sign-in.
        </p>
      </section>
    </main>
  );
}
