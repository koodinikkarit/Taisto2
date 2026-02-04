import {
  InstanceBase,
  InstanceStatus,
  Regex,
  combineRgb,
  runEntrypoint
} from "@companion-module/base";
import fetch from "node-fetch";

class TaistoModule extends InstanceBase {
  constructor(internal) {
    super(internal);
    this.config = {};
    this.pollTimer = null;
    this.trackedConPorts = new Set();
    this.connectionState = new Map();
    this.consecutivePollErrors = 0;
  }

  async init(config) {
    this.config = config;
    this.initActions();
    this.initFeedbacks();
    this.startPolling();
    this.updateStatus(InstanceStatus.Ok);
  }

  async destroy() {
    this.stopPolling();
  }

  async configUpdated(config) {
    this.config = config;
    this.initActions();
    this.initFeedbacks();
    this.startPolling();
  }

  getConfigFields() {
    return [
      {
        type: "textinput",
        id: "host",
        label: "Host",
        width: 8,
        default: "localhost",
        regex: Regex.HOSTNAME
      },
      {
        type: "number",
        id: "port",
        label: "Port",
        width: 4,
        min: 1,
        max: 65535,
        default: 1337
      },
      {
        type: "number",
        id: "pollInterval",
        label: "Poll interval (ms)",
        width: 4,
        min: 200,
        max: 10000,
        default: 1000
      }
    ];
  }

  initActions() {
    this.setActionDefinitions({
      set_video_connection: {
        name: "Set video connection",
        options: [
          {
            type: "textinput",
            label: "Con port id",
            id: "conPort",
            default: "35",
            regex: Regex.NUMBER
          },
          {
            type: "textinput",
            label: "CPU port id",
            id: "cpuPort",
            default: "37",
            regex: Regex.NUMBER
          }
        ],
        callback: async (action) => {
          const conPort = String(action.options.conPort || "").trim();
          const cpuPort = String(action.options.cpuPort || "").trim();
          if (!conPort || !cpuPort) return;

          try {
            const url = this.buildUrl(
              `/rest/con-ports/${encodeURIComponent(conPort)}/video-connection`
            );
            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ cpuPort })
            });

            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }

            this.updateStatus(InstanceStatus.Ok);
          } catch (err) {
            this.updateStatus(InstanceStatus.ConnectionFailure, String(err));
          }
        }
      },
      turn_off_video_connection: {
        name: "Turn off video connection",
        options: [
          {
            type: "textinput",
            label: "Con port id",
            id: "conPort",
            default: "35",
            regex: Regex.NUMBER
          }
        ],
        callback: async (action) => {
          const conPort = String(action.options.conPort || "").trim();
          if (!conPort) return;

          try {
            const url = this.buildUrl(
              `/rest/con-ports/${encodeURIComponent(conPort)}/video-connection`
            );
            const res = await fetch(url, { method: "DELETE" });

            if (!res.ok && res.status !== 204) {
              throw new Error(`HTTP ${res.status}`);
            }

            this.updateStatus(InstanceStatus.Ok);
          } catch (err) {
            this.updateStatus(InstanceStatus.ConnectionFailure, String(err));
          }
        }
      }
    });
  }

  initFeedbacks() {
    this.setFeedbackDefinitions({
      video_connection_active: {
        name: "Video connection active",
        type: "boolean",
        description: "Turns the button red when the con-port is connected to the selected CPU",
        defaultStyle: {
          bgcolor: combineRgb(255, 0, 0),
          color: combineRgb(255, 255, 255)
        },
        options: [
          {
            type: "textinput",
            label: "Con port id",
            id: "conPort",
            default: "35",
            regex: Regex.NUMBER
          },
          {
            type: "textinput",
            label: "CPU port id",
            id: "cpuPort",
            default: "37",
            regex: Regex.NUMBER
          }
        ],
        callback: (feedback) => {
          const conPort = String(feedback.options.conPort || "").trim();
          const cpuPort = String(feedback.options.cpuPort || "").trim();
          if (conPort) this.trackedConPorts.add(conPort);

          const state = this.connectionState.get(conPort);
          if (!state) return false;

          return state.status === "connected" && state.cpuPortId === cpuPort;
        }
      }
    });
  }

  buildUrl(path) {
    const host = this.config.host || "localhost";
    const port = this.config.port || 1337;
    return `http://${host}:${port}${path}`;
  }

  startPolling() {
    this.stopPolling();

    const pollIntervalRaw = Number(this.config.pollInterval || 1000);
    const pollInterval = Math.min(10000, Math.max(200, pollIntervalRaw));

    this.pollTimer = setInterval(() => {
      this.pollOnce().catch(() => undefined);
    }, pollInterval);

    this.pollOnce().catch(() => undefined);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async pollOnce() {
    if (!this.config.host) {
      this.updateStatus(InstanceStatus.BadConfig, "Host is required");
      return;
    }

    const conPorts = Array.from(this.trackedConPorts);
    if (conPorts.length === 0) {
      this.updateStatus(InstanceStatus.Ok);
      return;
    }

    let hadError = false;
    let lastError = null;

    for (const conPortId of conPorts) {
      try {
        const url = this.buildUrl(
          `/rest/con-ports/${encodeURIComponent(conPortId)}/video-connection`
        );
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const status = data && data.status ? String(data.status) : "unknown";
        const cpuPortId =
          data && data.cpuPort && data.cpuPort.id
            ? String(data.cpuPort.id)
            : status === "disconnected"
              ? "0"
              : null;

        this.connectionState.set(String(conPortId), {
          status,
          cpuPortId
        });
      } catch (err) {
        hadError = true;
        lastError = err;
        this.log(
          "warn",
          `Poll failed for conPort ${conPortId}: ${err?.message || err}`
        );
      }
    }

    if (hadError) {
      this.consecutivePollErrors += 1;
      if (this.consecutivePollErrors >= 3) {
        this.updateStatus(
          InstanceStatus.ConnectionFailure,
          lastError?.message || "Polling failed"
        );
      }
    } else {
      this.consecutivePollErrors = 0;
      this.updateStatus(InstanceStatus.Ok);
    }

    this.checkFeedbacks("video_connection_active");
  }
}

runEntrypoint(TaistoModule);
