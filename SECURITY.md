# Security Policy

## Security Model

- Clerk handles user authentication in the Next.js application.
- Convex functions derive server-side authorization from the authenticated Convex identity. Client-provided user identifiers must not be trusted for access decisions.
- Public client portal queries must return explicit client-safe projections rather than raw project, file, user, or team records.
- Internal notes, uploader IDs, team data, private assets, reference files, and other internal metadata must not be included in public portal responses.
- The application configures baseline response headers including frame, content-type, referrer, and browser-permission restrictions.

These controls describe the current implementation. They are not a claim of certification, regulatory compliance, or a formal security audit.

## Reporting A Vulnerability

Please report suspected vulnerabilities privately through the repository's GitHub security reporting interface. If private vulnerability reporting is unavailable, contact the repository owner privately through their GitHub profile.

Include:

- A description of the issue and its potential impact.
- Reproduction steps or a minimal proof of concept.
- The affected route, Convex function, or workflow.
- Any suggested mitigation, if known.

Do not include secrets, personal data, client files, or active exploit details in a public issue. Please allow the repository owner time to investigate before public disclosure.
