# 13 — Store and share safe Project files

**What to build:** Let cloud users add and manage safe Project-owned documents and images, share selected files through short-lived access, and understand quota or deletion effects. Storage pressure must block new writes without hiding or deleting existing files. Commit this slice to the shared rebuild branch; do not open a separate pull request or deploy it.

**Blocked by:** 12 — Review Media Versions with Comments.

**Status:** ready-for-agent

- [ ] PDF, plain text, Markdown, JPEG, PNG, and WebP files up to 20 MB are accepted; HTML, SVG, scripts, executables, archives, direct video, and direct audio are rejected.
- [ ] Private files use short-lived signed links; portal visibility is explicit; Allow Download defaults off for shared image, PDF, and text files; Markdown renders without raw HTML while visible text remains copyable.
- [ ] The free Workspace limit is 200 MB, all retained Media Versions and archived files count, and a service-capacity guard blocks new uploads before provider capacity is exhausted.
- [ ] Archive and permanent deletion explain retained size and affected history, and tests cover type, size, quota, version accounting, signed access, visibility, download, service refusal, and no automatic deletion.

