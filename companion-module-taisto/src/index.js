import {
  InstanceBase,
  InstanceStatus,
  Regex,
  combineRgb,
  runEntrypoint
} from "@companion-module/base";
import fetch from "node-fetch";

const PROJECTOR_COMMANDS = [
  {
    id: "power_toggle",
    label: "Power (toggle)",
    category: "4054",
    code: "15"
  },
  {
    id: "freeze",
    label: "Freeze",
    category: "855A",
    code: "67"
  },
  {
    id: "picture_blank",
    label: "Picture (blank)",
    category: "4054",
    code: "24"
  },
  {
    id: "input_video",
    label: "Input Video",
    category: "4054",
    code: "2A"
  },
  {
    id: "input_a",
    label: "Input A",
    category: "4054",
    code: "2B"
  },
  {
    id: "input_b",
    label: "Input B",
    category: "4054",
    code: "2C"
  },
  {
    id: "input_c",
    label: "Input C",
    category: "4054",
    code: "6F"
  },
  {
    id: "input_d",
    label: "Input D",
    category: "4054",
    code: "70"
  }
];

class TaistoModule extends InstanceBase {
  constructor(internal) {
    super(internal);
    this.config = {};
    this.pollTimer = null;
    this.trackedConPorts = new Set();
    this.connectionState = new Map();
    this.consecutivePollErrors = 0;
    this.projectorState = null;
    this.projectorUsed = false;
    this.projectorConsecutiveErrors = 0;
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
      },
      {
        type: "textinput",
        id: "projectorHost",
        label: "Projector host",
        width: 8,
        default: "localhost",
        regex: Regex.HOSTNAME
      },
      {
        type: "number",
        id: "projectorPort",
        label: "Projector port",
        width: 4,
        min: 1,
        max: 65535,
        default: 8001
      },
      {
        type: "textinput",
        id: "projectorPath",
        label: "Projector path",
        width: 12,
        default: "/cgi-bin/web.cgi"
      }
    ];
  }

  async sendProjectorCommand(category, code) {
    this.projectorUsed = true;
    const categoryValue = String(category || "").trim();
    const codeValue = String(code || "").trim();
    if (!categoryValue || !codeValue) {
      throw new Error("Projector command category/code required");
    }

    const url = this.buildProjectorUrl();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        req: { type: "send", category: "control" },
        param: { category: categoryValue, code: codeValue }
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  }

  getProjectorCommandChoices() {
    return PROJECTOR_COMMANDS.map(cmd => ({
      id: cmd.id,
      label: cmd.label
    }));
  }

  getProjectorCommandById(id) {
    return PROJECTOR_COMMANDS.find(cmd => cmd.id === id);
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
      },
      projector_power: {
        name: "Tykki power",
        options: [
          {
            type: "textinput",
            label: "Category",
            id: "category",
            default: "4054"
          },
          {
            type: "textinput",
            label: "Code",
            id: "code",
            default: "15"
          }
        ],
        callback: async (action) => {
          const category = action.options.category;
          const code = action.options.code;
          try {
            await this.sendProjectorCommand(category, code);

            this.updateStatus(InstanceStatus.Ok);
          } catch (err) {
            this.updateStatus(InstanceStatus.ConnectionFailure, String(err));
          }
        }
      },
      projector_quick_command: {
        name: "Tykki pikakomento",
        options: [
          {
            type: "dropdown",
            label: "Command",
            id: "command",
            default: "power_toggle",
            choices: this.getProjectorCommandChoices()
          }
        ],
        callback: async (action) => {
          this.projectorUsed = true;
          const commandId = action.options.command;
          const command = this.getProjectorCommandById(commandId);
          if (!command) {
            this.updateStatus(
              InstanceStatus.BadConfig,
              "Projector command not found"
            );
            return;
          }

          try {
            await this.sendProjectorCommand(command.category, command.code);
            this.updateStatus(InstanceStatus.Ok);
          } catch (err) {
            this.updateStatus(InstanceStatus.ConnectionFailure, String(err));
          }
        }
      },
      projector_power_on: {
        name: "Tykki power on",
        options: [
          {
            type: "textinput",
            label: "Category",
            id: "category",
            default: "4054"
          },
          {
            type: "textinput",
            label: "Code",
            id: "code",
            default: "15"
          }
        ],
        callback: async (action) => {
          this.projectorUsed = true;
          const category = action.options.category;
          const code = action.options.code;
          try {
            await this.sendProjectorCommand(category, code);
            this.updateStatus(InstanceStatus.Ok);
          } catch (err) {
            this.updateStatus(InstanceStatus.ConnectionFailure, String(err));
          }
        }
      },
      projector_power_off: {
        name: "Tykki power off",
        options: [
          {
            type: "textinput",
            label: "Category",
            id: "category",
            default: "4054"
          },
          {
            type: "textinput",
            label: "Code",
            id: "code",
            default: "15"
          }
        ],
        callback: async (action) => {
          this.projectorUsed = true;
          const category = action.options.category;
          const code = action.options.code;
          try {
            await this.sendProjectorCommand(category, code);
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
      },
      projector_power_on: {
        name: "Tykki power on",
        type: "boolean",
        description: "Turns the button red when projector power is on",
        defaultStyle: {
          bgcolor: combineRgb(255, 0, 0),
          color: combineRgb(255, 255, 255)
        },
        options: [],
        callback: () => {
          this.projectorUsed = true;
          return this.projectorState === true;
        }
      }
    });
  }

  buildUrl(path) {
    const host = this.config.host || "localhost";
    const port = this.config.port || 1337;
    return `http://${host}:${port}${path}`;
  }

  buildProjectorUrl() {
    const host = this.config.projectorHost || "localhost";
    const port = this.config.projectorPort || 8001;
    const path = this.config.projectorPath || "/cgi-bin/web.cgi";
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
    const conPorts = Array.from(this.trackedConPorts);
    if (conPorts.length > 0 && !this.config.host) {
      this.updateStatus(InstanceStatus.BadConfig, "Host is required");
      return;
    }

    let hadError = false;
    let lastError = null;
    let projectorHadError = false;
    let lastProjectorError = null;

    if (conPorts.length > 0) {
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
    } else {
      this.consecutivePollErrors = 0;
    }

    if (hadError) {
      this.consecutivePollErrors += 1;
    } else {
      this.consecutivePollErrors = 0;
    }

    if (this.projectorUsed) {
      try {
        const url = this.buildProjectorUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            req: { type: "get", category: "control", lang: "en" }
          })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        this.projectorState = Boolean(data && data.current_power_is_on);
      } catch (err) {
        projectorHadError = true;
        lastProjectorError = err;
        this.log(
          "warn",
          `Projector poll failed: ${err?.message || err}`
        );
      }
    } else {
      this.projectorConsecutiveErrors = 0;
    }

    if (projectorHadError) {
      this.projectorConsecutiveErrors += 1;
    } else {
      this.projectorConsecutiveErrors = 0;
    }

    if (this.consecutivePollErrors >= 3) {
      this.updateStatus(
        InstanceStatus.ConnectionFailure,
        lastError?.message || "Polling failed"
      );
    } else if (this.projectorUsed && this.projectorConsecutiveErrors >= 3) {
      this.updateStatus(
        InstanceStatus.ConnectionFailure,
        lastProjectorError?.message || "Projector polling failed"
      );
    } else {
      this.updateStatus(InstanceStatus.Ok);
    }

    this.checkFeedbacks("video_connection_active");
    this.checkFeedbacks("projector_power_on");
  }
}

runEntrypoint(TaistoModule);
