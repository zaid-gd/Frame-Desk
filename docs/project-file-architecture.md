# Project File Architecture

CutLab stores project file identity separately from file versions.

## Canonical Model

- `projectFiles` represents a logical Deliverable, Reference, or Asset.
- `projectFileVersions` represents every uploaded or linked revision of that file.
- The newest version is derived from `versionNumber`; previous versions remain immutable history.
- Upload date, size, uploader, provider, provider ID, file name, MIME type, and notes are stored per version.
- Category, workflow status, client visibility, download permission, title, and description are stored on the logical file.

## Providers

Every version uses the same provider contract:

- `convex`: Blob stored in Convex file storage through a signed upload URL.
- `external`: Generic HTTP or HTTPS file link.
- `google_drive`: Google Drive URL plus optional provider file ID.
- `frame_io`: Frame.io URL plus optional provider asset ID.

Google Drive or Frame.io OAuth integrations can later resolve provider IDs, refresh metadata, and create new versions without changing the UI-facing file model.

## Access

- Personal project owners can view and edit their files.
- Team Owner and Editor roles can upload, link, update, and remove files.
- Reviewer can view and download files but cannot mutate them.
- Client Portal queries return only Deliverables explicitly marked `clientVisible`.
- Reference files, Assets, uploader IDs, internal notes, and version metadata are never included in the public portal projection.

## Compatibility

Legacy `portalDeliverables` records remain readable and manageable for existing portals. New deliverables are created through `projectFiles`, making the unified model the source of truth going forward.
