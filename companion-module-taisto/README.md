# Taisto Companion Module

## Summary
Bitfocus Companion module for the Taisto REST API. Provides an action to set a video connection and a feedback that turns the button red when the connection is active in REST state.

Dependency releases must be at least seven days old, and dependency install scripts are disabled by the module's `.npmrc`.

## Configuration
- Host: `localhost`
- Port: `1337`
- Taisto REST API key: API key created in **Settings → API keys**
- Poll interval: `1000` ms
- Projector poll interval: `1000` ms
- Projector host: `localhost`
- Projector port: `8001`
- Projector path: `/cgi-bin/web.cgi`

## Installation
1. Install dependencies in `companion-module-taisto`.
```bash
cd companion-module-taisto
npm install
```
2. Open Companion.
3. Go to `Settings` -> `Modules` -> `Install module from local folder`.
4. Select the `companion-module-taisto` folder.

Validate and build the module with `npm run check` and `npm run build`. Yarn is not required.

## Usage
1. Add the module instance and fill in Host/Port.
2. Add a button action `Set video connection`.
3. Set `Con port id` to `35`.
4. Set `CPU port id` to `37`.
5. Add a button feedback `Video connection active`.
6. Set `Con port id` to `35`.
7. Set `CPU port id` to `37`.
8. Set the feedback style background to red.
9. Optional: add action `Turn off video connection`.
10. Set `Con port id` to `35`.
11. Optional: add action `Tykki power` or `Tykki power on/off`.
12. Configure projector host/port/path if they differ from defaults.
13. To control an output group, add `Execute output group` and select the group and input. The lists refresh from Taisto automatically.
14. Add `Output group active` feedback with the same group and input. The button turns green after every output has reached that input.

## Action
- Set video connection
- Turn off video connection
- Execute output group
- Tykki power
- Tykki pikakomento
- Tykki power on
- Tykki power off

Options for "Set video connection":
- Con port id
- CPU port id

Options for "Turn off video connection":
- Con port id

Options for "Execute output group":
- Output group
- Input

All Taisto actions send the configured API key in the `X-API-Key` header. Read-only status requests continue to work without a key.

Options for projector actions:
- Category (default `4054`)
- Code (default `15`)

Options for "Tykki pikakomento":
- Power (toggle)
- Freeze
- Picture (blank)
- Input Video
- Input A
- Input B
- Input C
- Input D

## Feedback
- Video connection active
- Output group active
- Tykki power on
- Tykki input active
- Tykki current input label

Options:
- Con port id
- CPU port id

The feedback becomes active when the REST endpoint reports `status: connected` and the returned `cpuPort.id` matches the configured CPU port.

`Output group active` polls the group status endpoint and becomes active only when every output in the selected group reports the selected input. It becomes inactive if even one output differs, is disconnected, or has no known state.

## Projector notes
- Power command is sent to `http://<projectorHost>:<projectorPort><projectorPath>`.
- Default power command uses category `4054` and code `15` (power).
- If your projector supports discrete ON/OFF codes, put them in the `Tykki power on/off` actions.
- If not, both on/off actions will behave like toggle with the default code.
- Status polling request:
```json
{ "req": { "type": "get", "category": "control", "lang": "en" } }
```
- Feedback reads `current_power_is_on` from the response.
- Pikakomennot käyttävät valmiita koodeja (Input A/B/C/D, Video, Freeze, Picture Blank, Power).
- Input feedback reads `current_input` from the response (values `input1`..`input5`).
- Current input label feedback uses `label` from the response (falls back to Input names).
