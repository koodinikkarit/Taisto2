# Taisto Matrix (REST)

## Configuration
- Host: `localhost`
- Port: `1337`
- Poll interval: `1000` ms
- Projector host: `localhost`
- Projector port: `8001`
- Projector path: `/cgi-bin/web.cgi`

## Actions
- Set video connection
- Turn off video connection
- Tykki power
- Tykki pikakomento
- Tykki power on
- Tykki power off

## Feedback
- Video connection active
- Tykki power on

## Notes
The feedback turns the button red when the REST endpoint reports `status: connected` and the returned `cpuPort.id` matches the configured CPU port.
Projector power commands default to category `4054` and code `15`. If your projector supports discrete ON/OFF codes, set them in the action options.
Projector status is read from `current_power_is_on` in the GET response.
