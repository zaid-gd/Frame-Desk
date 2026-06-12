# Security

## Client Portal Protection

Client portals are public bearer links. Editors can additionally require a PIN or password, disable the link, set an expiry, or regenerate its token.

- Portal passwords are optional. Existing and newly created portals remain unprotected until an editor enables protection.
- Passwords are derived with PBKDF2-SHA-256 using a random 16-byte salt and 120,000 iterations.
- Convex stores only the derived hash, salt, and iteration count. Plaintext passwords are never written to the database.
- Hash material is excluded from editor and public query responses. Editors can only see whether protection is enabled.
- A protected portal returns only `{ access: "locked" }` until the submitted credential verifies. Deliverables, revisions, client notes, and project metadata are not queried or returned first.
- Missing and incorrect credentials use the same locked response. Public revision submissions use the same password, enabled, and expiry checks.
- Removing protection deletes the stored hash, salt, and iteration count.
- The browser keeps an entered credential only in component memory for the current page session. It is not placed in the URL or browser storage.

Portal links and their passwords are still shared secrets. Use expiry and token regeneration when access should end, and avoid reusing account passwords as portal credentials.

## Reporting A Vulnerability

Please use the repository's private security advisory feature rather than opening a public issue with exploit details or sensitive project data.
