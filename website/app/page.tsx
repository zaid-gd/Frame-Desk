import Image from "next/image";

const workObjects = [
  "Active cuts",
  "Due dates",
  "Revision notes",
  "Client portals",
  "File versions",
  "Salary batches",
  "Team comments",
  "Delivery history"
];

const workflow = [
  {
    label: "Plan",
    title: "Turn the edit into a production record.",
    text: "Capture the client, work type, start date, due date, payout context, notes, and first stage before the project starts drifting."
  },
  {
    label: "Track",
    title: "See what is active, late, blocked, or waiting.",
    text: "The dashboard, project table, timeline, and calendar keep production state visible without forcing editors into a generic task system."
  },
  {
    label: "Review",
    title: "Keep feedback close to the cut.",
    text: "Revision requests, client-safe notes, review links, and activity history stay attached to the project they belong to."
  },
  {
    label: "Deliver",
    title: "Hand off approved files with context intact.",
    text: "Deliverables, references, assets, upload history, versions, and client portal visibility all resolve from the same project workspace."
  }
];

const studioFit = [
  ["Freelance editors", "Track multiple clients, due dates, earnings, revisions, and personal output without building another spreadsheet."],
  ["Small editing teams", "Run shared projects with owners, editors, reviewers, assignments, comments, notifications, and team activity."],
  ["Production-focused studios", "Keep delivery state, client visibility, files, timelines, and planning in one operating layer."]
];

const features = [
  ["Project management", "Project records carry status, dates, clients, assignments, earnings, notes, files, tags, and production movement."],
  ["Revision management", "Review state, feedback, notes, revision limits, and activity history stay visible until the work is delivered."],
  ["Deliverable tracking", "A unified file workspace separates deliverables, references, assets, upload history, and immutable versions."],
  ["Client visibility", "Account-free portals show progress, approved downloads, client-safe notes, timeline events, and revision context."],
  ["Production planning", "Timeline and calendar views help teams see pressure before deadlines become surprises."],
  ["Activity history", "Project changes, shared comments, team updates, and delivery movement create a useful production trail."]
];

const clientPortal = [
  "Approved deliverables",
  "Download controls",
  "Revision limits",
  "Client-safe notes",
  "Timeline events"
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="CutLab Studio home">
          <Image src="/brand/cutlab-studio.png" width={190} height={72} alt="CutLab Studio" priority />
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#product">Product</a>
          <a href="#workflow">Workflow</a>
          <a href="#teams">Teams</a>
          <a href="#delivery">Delivery</a>
        </nav>
        <a className="nav-cta" href="mailto:hello@cutlab.studio?subject=CutLab%20Studio%20launch%20access">Request access</a>
      </header>

      <section id="top" className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="kicker">Production workspace for video editors</p>
            <h1>Run the edit from first cut to final handoff.</h1>
            <p className="hero-text">
              CutLab Studio gives video editors and small creative teams one workspace for projects, revisions, deliverables, clients, planning, and production history.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="mailto:hello@cutlab.studio?subject=CutLab%20Studio%20launch%20access">Request launch access</a>
              <a className="button secondary" href="#product">See the workspace</a>
            </div>
          </div>

          <div className="hero-board" aria-label="CutLab Studio product overview">
            <div className="hero-card">
              <div className="hero-card-header">
                <span>Production today</span>
                <strong>4 stages watched</strong>
              </div>
              <Image className="screen main-screen" src="/screenshots/dashboard.png" width={1600} height={900} alt="CutLab Studio dashboard showing production priorities, workflow health, salary progress, and activity" priority />
            </div>
            <div className="hero-rail">
              <div>
                <span>Next delivery</span>
                <strong>Client promo revision</strong>
                <small>Review notes open</small>
              </div>
              <div>
                <span>Batch progress</span>
                <strong>12 of 20 edits</strong>
                <small>Salary batch visible</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="object-strip" aria-label="CutLab tracks production objects">
        {workObjects.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section id="product" className="section product-section">
        <div className="section-copy">
          <p className="kicker">The operating layer</p>
          <h2>Built around the objects editors actually manage.</h2>
          <p>
            CutLab is not a general project board with creative labels pasted on top. The workspace understands delivery dates, review state, assets, versions, clients, salary progress, and activity history as part of the same production record.
          </p>
        </div>
        <div className="showcase-grid">
          <div className="showcase-primary">
            <Image src="/screenshots/dashboard.png" width={1600} height={900} alt="Dashboard command center with workflow pipeline and delivery priorities" />
          </div>
          <div className="showcase-panel">
            <span>Command center</span>
            <h3>Dashboard first, table second.</h3>
            <p>Upcoming deliveries, workflow health, active work, pending feedback, salary progress, and recent activity are surfaced before the project list.</p>
          </div>
        </div>
      </section>

      <section id="workflow" className="section workflow-section">
        <div className="section-copy compact">
          <p className="kicker">Production workflow</p>
          <h2>From planned edit to delivered file, without losing context.</h2>
        </div>
        <div className="workflow-list">
          {workflow.map((item) => (
            <article key={item.label} className="workflow-item">
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split-showcase">
        <div className="split-visual">
          <Image src="/screenshots/projects.png" width={1600} height={900} alt="CutLab projects view showing workspace tabs and project table" />
        </div>
        <div className="split-copy">
          <p className="kicker">Personal plus shared work</p>
          <h2>Solo edits stay private. Team projects stay accountable.</h2>
          <p>
            Editors can separate personal work from shared production. Teams get owner, editor, and reviewer roles, plus project comments, notifications, chat, assignments, and activity.
          </p>
          <div className="role-grid">
            {studioFit.map(([title, text]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section feature-section">
        <div className="feature-lede">
          <h2>What the workspace keeps under control.</h2>
          <p>CutLab keeps the production record specific enough to help editors make the next decision quickly.</p>
        </div>
        <div className="feature-grid">
          {features.map(([title, text], index) => (
            <article key={title} className={index === 0 || index === 3 ? "feature-cell wide" : "feature-cell"}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="teams" className="section team-section">
        <div className="team-copy">
          <p className="kicker">Small-team collaboration</p>
          <h2>Enough structure for a studio, without enterprise ceremony.</h2>
          <p>
            CutLab centralizes team membership, client contacts, shared project updates, comments, notifications, chat, and activity while keeping role boundaries clear.
          </p>
        </div>
        <div className="team-composition">
          <Image className="team-screen" src="/screenshots/team.png" width={1600} height={900} alt="CutLab team workspace showing members, client contacts, notifications, and activity" />
          <Image className="team-asset" src="/empty-states/team.png" width={900} height={720} alt="CutLab team collaboration illustration" />
        </div>
      </section>

      <section id="delivery" className="section delivery-section">
        <div className="delivery-card">
          <div>
            <p className="kicker">Client visibility</p>
            <h2>Expose the delivery layer, not the whole studio.</h2>
            <p>
              Client portals are generated from real project records, so clients can see what is approved, downloadable, in revision, and ready without seeing internal earnings, notes, team data, assets, or references.
            </p>
          </div>
          <div className="portal-list">
            {clientPortal.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="delivery-assets">
          <Image src="/empty-states/feedback.png" width={640} height={480} alt="CutLab feedback workflow illustration" />
          <Image src="/empty-states/schedule.png" width={640} height={480} alt="CutLab deadline planning illustration" />
          <Image src="/empty-states/projects.png" width={640} height={480} alt="CutLab project delivery illustration" />
        </div>
      </section>

      <section className="closing-section">
        <div className="closing-mark">
          <Image src="/brand/app-icon-dark.svg" width={96} height={96} alt="" aria-hidden="true" />
        </div>
        <h2>A focused production workspace for the way editors actually deliver.</h2>
        <p>
          Plan the work, track the review, manage the handoff, preserve the history, and keep the team aligned from first cut to final delivery.
        </p>
        <a className="button primary" href="mailto:hello@cutlab.studio?subject=CutLab%20Studio%20launch%20access">Request launch access</a>
      </section>

      <footer className="site-footer">
        <Image src="/brand/cutlab-studio.png" width={152} height={58} alt="CutLab Studio" />
        <p>Project management, production workflow, revision tracking, and client delivery for video editors.</p>
      </footer>
    </main>
  );
}
