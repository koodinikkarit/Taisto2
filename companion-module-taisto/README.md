# Taisto Companion Module

## Summary
Bitfocus Companion module for the Taisto REST API. Provides an action to set a video connection and a feedback that turns the button red when the connection is active in REST state.

## Configuration
- Host: `localhost`
- Port: `1337`
- Poll interval: `1000` ms

## Installation
1. Build the module.
```bash
npm install
```
2. Open Companion.
3. Go to `Settings` -> `Modules` -> `Install module from local folder`.
4. Select the `companion-module-taisto` folder.

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

## Action
- Set video connection
- Turn off video connection

Options for "Set video connection":
- Con port id
- CPU port id

Options for "Turn off video connection":
- Con port id

## Feedback
- Video connection active

Options:
- Con port id
- CPU port id

The feedback becomes active when the REST endpoint reports `status: connected` and the returned `cpuPort.id` matches the configured CPU port.
