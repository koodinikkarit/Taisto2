# Taisto Matrix (REST)

## Configuration
- Host: `localhost`
- Port: `1337`
- Poll interval: `1000` ms

## Actions
- Set video connection
- Turn off video connection

## Feedback
- Video connection active

## Notes
The feedback turns the button red when the REST endpoint reports `status: connected` and the returned `cpuPort.id` matches the configured CPU port.
