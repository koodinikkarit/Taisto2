# Changelog

## [Unreleased]

## [0.1.19] - 2026-08-16
### Added
- Added an output-group REST status endpoint and Companion feedback that becomes active only after every output in the group has switched to the selected input.
- Added a read-only Output groups page to the main navigation for running configured groups without exposing editing controls.
- Output groups can now allow every matrix input or restrict execution to inputs selected in Settings.
- The Output groups settings page and its Settings navigation entries now follow the selected Finnish or English language.
- Output group cards now list their outputs individually, show the selected input explicitly, and use clearer active, inactive, and pending status indicators.
- Output group cards always show the currently active input without requiring a target input selection, including mixed and unknown output states.
- The Output group Execute button now has a two-second per-group UI cooldown to prevent accidental repeated commands.
- Default state Execute buttons now use the same two-second per-state UI cooldown.

## [0.1.18] - 2026-08-12
### Fixed
- Protected Promode and Settings content now waits for browser-side session validation before rendering, including navigation without a full page reload.
- Open protected pages now revalidate the session periodically and return to login when the session expires.
- Audit log entries now use a responsive card layout that does not require horizontal scrolling on narrow screens.

## [0.1.17] - 2026-08-12
### Changed
- Tag builds now assign the GHCR `latest` tag only to the newest stable semantic version and create a GitHub Release with the Companion ZIP attached.

## [0.1.16] - 2026-08-11
### Added
- Added normalized SQLite persistence with schema migrations, transactions, foreign keys, and WAL journaling.
- Added automatic one-time migration from `database/database.json`, including a timestamped JSON backup.
- Added commands for explicit JSON-to-SQLite migration and SQLite-to-JSON export.

### Changed
- Application data, output groups, and REST API keys are now persisted in `database/taisto.sqlite`.
- REST API keys remain stored in plaintext so they can be viewed again in Settings.
- npm dependency resolution now requires releases to be at least seven days old and disables dependency install scripts.
- GitHub Actions verifies the dependency lock against the npm safety policy before building a release image.
- The Companion module can execute output groups, load group/input choices from Taisto, and authenticate mutations with a REST API key.
- The tag-triggered GitHub Actions release builds the Companion module, uploads its ZIP as a workflow artifact, and includes the same download on the Help page inside the Docker image.
- SQLite-backed audit logging now records REST changes, GraphQL mutations, API-key administration, login attempts, and WebSocket video/KVM commands without storing credentials. Retention is time-based, configured with `TAISTO_AUDIT_RETENTION_DAYS`, and defaults to 90 days.

## [0.1.15] - 2026-08-09
### Fixed
- Fixed route parameter handling in diagram, matrix, and default-state detail views, preventing blank pages when opening an item by name.

## [0.1.14] - 2026-08-09
### Fixed
- Fixed every GraphQL list to return database records rather than Immutable Map key-value pairs.
- Fixed diagrams, diagram screens, default states, weekly timers, matrix ports, and their nested lists so existing database content appears in the interface.

## [0.1.13] - 2026-08-09
### Fixed
- Added JSON request-body parsing for GraphQL POST requests, restoring data loading in the browser interface.

## [0.1.12] - 2026-08-09
### Fixed
- Matrix list queries now return Map values rather than key-value tuples.

## [0.1.11] - 2026-08-09
### Fixed
- Matrix GraphQL list queries now convert Immutable Maps to arrays before returning them to GraphQL.

## [0.1.10] - 2026-08-09
### Fixed
- GraphQL resolvers now support both legacy plain-object database records and Immutable records.

## [0.1.9] - 2026-08-09
### Fixed
- Docker build now includes `CHANGELOG.md`, allowing the embedded Help-page changelog to compile.

## [0.1.8] - 2026-08-09
### Fixed
- GraphQL now resolves Immutable Matrix, ConPort and CpuPort records correctly instead of returning `null` fields.
- Matrix names and port data from existing `database.json` files are displayed correctly.

## [0.1.7] - 2026-08-09
### Added
- React 18 and modern Apollo Client runtime.
- Finnish and English interface language selection.
- Markdown-based Help page with source and release links.
- Visible application version and unique GitHub Actions build identifier.
- Web login page for optional Promode and Settings password protection.

### Changed
- Docker images are built and published only from `v*` Git tags.
- Docker build embeds the release version, build identifier, and Help content.
- Promode route handling and Finnish character encoding were fixed.

## [2026-02-04]
### Added
- `GET /rest/con-ports/{id}/video-connection` for fetching the last known video-connection state.
- In-memory tracking of video and KWM connection states to back REST status queries.
- Bitfocus Companion quick-start documentation in `README.md` and `REST_API.md` (includes polling guidance, performance note, and compatibility).
- Companion module skeleton for Taisto REST control and red active feedback in `companion-module-taisto/`, plus a disconnect action.
- Companion module structure aligned with the template (`companion/manifest.json`, `companion/HELP.md`, `main.js`, `src/`).
- Companion module polling now logs per-port errors and only marks connection failure after 3 consecutive poll errors.
- Companion module adds projector power action and power-on feedback with REST polling.
- Companion module adds discrete projector power on/off actions with configurable codes.
- Companion module adds projector quick command presets for inputs and common controls.
- Companion module adds projector poll interval configuration.
- Companion module adds projector input feedback based on `current_input`.
- Companion module adds current input label feedback based on `label`.
