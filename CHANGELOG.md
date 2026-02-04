# Changelog

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
