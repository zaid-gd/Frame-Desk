import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type LegalSection = {
  title: string;
  body: ReactNode;
};

type LegalPageProps = {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
};

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  background: "var(--app-canvas, #fbfaf8)",
  color: "var(--app-ink, #19171f)",
  padding: "48px 20px 64px"
};

const shellStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "0 auto"
};

const navStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 32
};

const linkStyle: CSSProperties = {
  border: "1px solid var(--app-border, #dedbe5)",
  borderRadius: 6,
  color: "var(--app-accent, #5b3fa0)",
  fontSize: 14,
  fontWeight: 760,
  padding: "10px 14px",
  textDecoration: "none"
};

const cardStyle: CSSProperties = {
  background: "var(--app-panel, #ffffff)",
  border: "1px solid var(--app-border, #dedbe5)",
  borderRadius: 8,
  padding: "clamp(24px, 5vw, 48px)"
};

const eyebrowStyle: CSSProperties = {
  color: "var(--app-muted, #6f6a78)",
  fontSize: 12,
  fontWeight: 760,
  letterSpacing: 0.6,
  margin: 0,
  textTransform: "uppercase"
};

const titleStyle: CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "clamp(42px, 8vw, 76px)",
  fontWeight: 760,
  letterSpacing: 0,
  lineHeight: 0.96,
  margin: "12px 0 18px"
};

const introStyle: CSSProperties = {
  color: "var(--app-muted, #6f6a78)",
  fontSize: 17,
  lineHeight: 1.65,
  margin: 0,
  maxWidth: 760
};

const sectionStyle: CSSProperties = {
  borderTop: "1px solid var(--app-border, #dedbe5)",
  marginTop: 28,
  paddingTop: 26
};

const headingStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 760,
  lineHeight: 1.2,
  margin: "0 0 12px"
};

export function LegalPage({ title, updatedAt, intro, sections }: LegalPageProps) {
  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <nav aria-label="Legal pages" style={navStyle}>
          <Link href="/" style={linkStyle}>Back to App</Link>
          <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>
          <Link href="/terms" style={linkStyle}>Terms of Service</Link>
        </nav>
        <article style={cardStyle}>
          <p style={eyebrowStyle}>Last updated {updatedAt}</p>
          <h1 style={titleStyle}>{title}</h1>
          <p style={introStyle}>{intro}</p>
          {sections.map((section) => (
            <section key={section.title} style={sectionStyle}>
              <h2 style={headingStyle}>{section.title}</h2>
              <div className="legal-copy">{section.body}</div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
