# Relay glossary

## Product

**Relay** — A video-workflow workspace for freelance editors and small post-production teams. Relay replaces the CutLab Studio and Frame Desk product names in the rebuild. The current deployed product keeps its existing name and copy until the full rebuild ships.

**Workspace** — The signed-in or local work area that groups clients, projects, files, schedules, reports, people, and settings. The first release has one Workspace per account. A Workspace starts as a solo space and becomes a Team workspace when its Owner invites people. Do not use Workspace as a synonym for one Project.

**Client** — A durable record for the person or company that commissions Projects. A Client can hold contact details, Project history, Project Groups, money totals, and Client Portal links. A Client is not a Team Member unless the same person also has an internal role.

**Project Group** — An optional set of related Projects for one Client, such as a retainer, campaign, or production run. Its progress, Project count, and money totals come from its Projects. A Project can belong to no more than one Project Group.

**Project** — One tracked video job and one possible Salary Plan count. It belongs to one Client and can belong to one Project Group. It holds workflow, dates, money, assignments, Project Outputs, files, review work, and activity.

**Project Output** — One promised result inside a Project, such as a main video, short cut, thumbnail, captions, or document. It can hold several Media Versions. Project Outputs do not count as Projects for Salary Plans. Use Project Output instead of the old deliverable target, task, subtask, or template-checklist terms.

**Media Version** — One uploaded or linked version of a Project Output. A Project Output has one current Media Version and can retain older versions and their Comments.

**Workflow Template** — A reusable starting set for a Project. It can define workflow stages, starter Project Outputs, relative deadlines, roles, and Client Portal defaults. Relay copies it into a new Project, so later edits do not change existing Projects. Do not shorten this term to Template where the kind could be unclear.

**Salary Plan** — A solo contract rule tied to one Client. It sets how many delivered Projects form a batch and the full amount earned for that batch. Project Outputs do not add to its count, and partial progress has no partial money value.

**Salary Batch** — An unchanging record created when a Salary Plan reaches its required number of delivered Projects. It stores the copied plan terms and counted Project identifiers. Later Project or Salary Plan changes do not rewrite a completed Salary Batch.

**Team Member** — A person who works inside the Workspace as an Owner, Editor, or Viewer. Client access stays in the Client Portal.

**Review** — A feedback cycle for a Project Output. Use Review for the whole cycle and Comment for one note tied to the Media Version that received it.

**Client Portal** — The Client-facing, token-based area for one Project's approved details and current shared Media Versions. It stays separate from the internal Workspace.

**Resource** — A saved link or reference item used by the Team. A Media Version is not a Resource.

## Interface

**App Shell** — The shared sidebar, top bar, mobile navigation, and content frame around internal routes.

**Page System** — The shared page headers, toolbars, sections, metric strips, tables, empty states, and pane layouts used inside the App Shell.

**Density** — The spacing and control-size setting for repeated work. It must change space without hiding features.
