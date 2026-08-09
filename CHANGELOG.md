# Changelog

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
