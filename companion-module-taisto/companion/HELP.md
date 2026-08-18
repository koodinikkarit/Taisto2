# Taisto Matrix (REST)

## Configuration
- Host: `localhost`
- Port: `1337`
- Taisto REST API key: API key created in **Settings → API keys**
- Poll interval: `1000` ms
- Projector poll interval: `1000` ms
- Projector host: `localhost`
- Projector port: `8001`
- Projector path: `/cgi-bin/web.cgi`

## Actions
- Set video connection
- Turn off video connection
- Execute output group
- Tykki power
- Tykki pikakomento
- Tykki power on
- Tykki power off

## Feedback
- Video connection active
- Matrix current input label
- Output group active
- Tykki power on
- Tykki input active
- Tykki current input label

## Notes
The feedback turns the button red when the REST endpoint reports `status: connected` and the returned `cpuPort.id` matches the configured CPU port.
`Matrix current input label` selects a named matrix output and replaces the button text with the number and name of its currently connected input.
Projector power commands default to category `4054` and code `15`. If your projector supports discrete ON/OFF codes, set them in the action options.
Projector status is read from `current_power_is_on` in the GET response.
Projector input feedback uses `current_input` (`input1`..`input5`).
Current input label feedback uses `label` from the GET response.

`Execute output group` loads output groups and matrix inputs from Taisto and switches every output in the selected group to the selected input. Taisto actions send the configured API key in the `X-API-Key` header.

`Set video connection` loads its output and input choices from Taisto and shows the matrix name, port number and configured port name. Existing actions that contain a manually entered port ID remain supported.

`Output group active` uses the same output-group and input selections. It turns the button green only after every output in the group reports that input, and turns off if any output no longer matches.
