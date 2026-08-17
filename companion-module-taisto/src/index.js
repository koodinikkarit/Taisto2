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

const PROJECTOR_INPUTS = [
  { id: "input1", label: "Input Video" },
  { id: "input2", label: "Input A" },
  { id: "input3", label: "Input B" },
  { id: "input4", label: "Input C" },
  { id: "input5", label: "Input D" }
];

class TaistoModule extends InstanceBase {
  constructor(internal) {
    super(internal);
    this.config = {};
    this.pollTimer = null;
    this.trackedConPorts = new Set();
    this.connectionState = new Map();
    this.trackedOutputGroups = new Map();
    this.outputGroupState = new Map();
    this.consecutivePollErrors = 0;
    this.projectorState = null;
    this.projectorCurrentInput = null;
    this.projectorLabels = null;
    this.projectorUsed = false;
    this.projectorConsecutiveErrors = 0;
    this.lastMatrixPollAt = 0;
    this.lastProjectorPollAt = 0;
    this.lastResourceRefreshAt = 0;
    this.conGroups = [];
    this.matrices = [];
    this.resourceSignature = "";
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
    this.resourceSignature = "";
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
        type: "textinput",
        id: "apiKey",
        label: "Taisto REST API key",
        width: 12,
        default: ""
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
        type: "number",
        id: "projectorPollInterval",
        label: "Projector poll interval (ms)",
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

  getProjectorInputChoices() {
    return PROJECTOR_INPUTS.map(input => ({
      id: input.id,
      label: input.label
    }));
  }

  getProjectorCommandById(id) {
    return PROJECTOR_COMMANDS.find(cmd => cmd.id === id);
  }

  getProjectorInputLabel(inputId) {
    if (!inputId) return null;
    const labels = this.projectorLabels || {};
    if (labels[inputId]) return String(labels[inputId]);
    const fallback = PROJECTOR_INPUTS.find(input => input.id === inputId);
    return fallback ? fallback.label : String(inputId);
  }

  getOutputGroupChoices() {
    const choices = this.conGroups.map(group => ({
      id: String(group.id),
      label: group.matrix && group.matrix.slug
        ? `${group.slug} (${group.matrix.slug})`
        : group.slug
    }));
    return choices.length > 0
      ? choices
      : [{ id: "", label: "No output groups found" }];
  }

  getCpuPortChoices() {
    const choices = [];
    this.matrices.forEach(matrix => {
      (matrix.cpuPorts || []).forEach(port => {
        choices.push({
          id: String(port.id),
          label: `${matrix.slug}: ${port.portNum}. ${port.slug}`
        });
      });
    });
    return choices.length > 0
      ? choices
      : [{ id: "", label: "No inputs found" }];
  }

  async refreshTaistoResources(rebuildActions = true) {
    if (!this.config.host) return;
    try {
      const [groupsResponse, matricesResponse] = await Promise.all([
        this.taistoFetch("/rest/con-groups"),
        this.taistoFetch("/rest/matrices")
      ]);
      if (!groupsResponse.ok || !matricesResponse.ok) {
        throw new Error(`Resource refresh failed (groups ${groupsResponse.status}, matrices ${matricesResponse.status})`);
      }

      const conGroups = await groupsResponse.json();
      const matrices = await matricesResponse.json();
      const signature = JSON.stringify({ conGroups, matrices });
      const changed = signature !== this.resourceSignature;
      this.conGroups = Array.isArray(conGroups) ? conGroups : [];
      this.matrices = Array.isArray(matrices) ? matrices : [];
      this.resourceSignature = signature;
      this.lastResourceRefreshAt = Date.now();
      if (changed && rebuildActions) {
        this.initActions();
        this.initFeedbacks();
      }
    } catch (err) {
      this.lastResourceRefreshAt = Date.now();
      this.log("warn", `Taisto resource refresh failed: ${err?.message || err}`);
    }
  }

  initActions() {
    const outputGroupChoices = this.getOutputGroupChoices();
    const cpuPortChoices = this.getCpuPortChoices();
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
            const res = await this.taistoFetch(
              `/rest/con-ports/${encodeURIComponent(conPort)}/video-connection`, {
              method: "POST",
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
            const res = await this.taistoFetch(
              `/rest/con-ports/${encodeURIComponent(conPort)}/video-connection`,
              { method: "DELETE" }
            );

            if (!res.ok && res.status !== 204) {
              throw new Error(`HTTP ${res.status}`);
            }

            this.updateStatus(InstanceStatus.Ok);
          } catch (err) {
            this.updateStatus(InstanceStatus.ConnectionFailure, String(err));
          }
        }
      },
      execute_output_group: {
        name: "Execute output group",
        options: [
          {
            type: "dropdown",
            label: "Output group",
            id: "conGroup",
            default: outputGroupChoices[0].id,
            choices: outputGroupChoices,
            allowCustom: true
          },
          {
            type: "dropdown",
            label: "Input",
            id: "cpuPort",
            default: cpuPortChoices[0].id,
            choices: cpuPortChoices,
            allowCustom: true,
            minChoicesForSearch: 10
          }
        ],
        callback: async (action) => {
          const conGroup = String(action.options.conGroup || "").trim();
          const cpuPortId = String(action.options.cpuPort || "").trim();
          if (!conGroup || !cpuPortId) {
            this.updateStatus(InstanceStatus.BadConfig, "Output group and input are required");
            return;
          }

          try {
            const res = await this.taistoFetch(
              `/rest/con-groups/${encodeURIComponent(conGroup)}/execute`,
              {
                method: "POST",
                body: JSON.stringify({ cpuPortId })
              }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      output_group_active: {
        name: "Output group active",
        type: "boolean",
        description: "Turns the button on when every output in the group is connected to the selected input",
        defaultStyle: {
          bgcolor: combineRgb(0, 153, 51),
          color: combineRgb(255, 255, 255)
        },
        options: [
          {
            type: "dropdown",
            label: "Output group",
            id: "conGroup",
            default: this.getOutputGroupChoices()[0].id,
            choices: this.getOutputGroupChoices(),
            allowCustom: true
          },
          {
            type: "dropdown",
            label: "Input",
            id: "cpuPort",
            default: this.getCpuPortChoices()[0].id,
            choices: this.getCpuPortChoices(),
            allowCustom: true,
            minChoicesForSearch: 10
          }
        ],
        callback: (feedback) => {
          const conGroup = String(feedback.options.conGroup || "").trim();
          const cpuPort = String(feedback.options.cpuPort || "").trim();
          if (!conGroup || !cpuPort) return false;
          const key = `${conGroup}:${cpuPort}`;
          this.trackedOutputGroups.set(key, { key, conGroup, cpuPort });
          return this.outputGroupState.get(key) === true;
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
      },
      projector_input_active: {
        name: "Tykki input active",
        type: "boolean",
        description: "Turns the button on when projector current_input matches",
        defaultStyle: {
          bgcolor: combineRgb(0, 102, 204),
          color: combineRgb(255, 255, 255)
        },
        options: [
          {
            type: "dropdown",
            label: "Input",
            id: "input",
            default: "input3",
            choices: this.getProjectorInputChoices()
          }
        ],
        callback: (feedback) => {
          this.projectorUsed = true;
          const input = feedback.options.input;
          if (!input) return false;
          return this.projectorCurrentInput === String(input);
        }
      },
      projector_current_input_label: {
        name: "Tykki current input label",
        type: "advanced",
        description: "Sets button text to current input label",
        options: [],
        callback: () => {
          this.projectorUsed = true;
          const label = this.getProjectorInputLabel(this.projectorCurrentInput);
          if (!label) return {};
          return { text: label };
        }
      }
    });
  }

  buildUrl(path) {
    const host = this.config.host || "localhost";
    const port = this.config.port || 1337;
    return `http://${host}:${port}${path}`;
  }

  taistoFetch(path, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const apiKey = String(this.config.apiKey || "").trim();
    if (apiKey) headers["X-API-Key"] = apiKey;
    return fetch(this.buildUrl(path), Object.assign({}, options, { headers }));
  }

  buildProjectorUrl() {
    const host = this.config.projectorHost || "localhost";
    const port = this.config.projectorPort || 8001;
    const path = this.config.projectorPath || "/cgi-bin/web.cgi";
    return `http://${host}:${port}${path}`;
  }

  getMatrixPollInterval() {
    const pollIntervalRaw = Number(this.config.pollInterval || 1000);
    return Math.min(10000, Math.max(200, pollIntervalRaw));
  }

  getProjectorPollInterval() {
    const pollIntervalRaw = Number(this.config.projectorPollInterval || 1000);
    return Math.min(10000, Math.max(200, pollIntervalRaw));
  }

  startPolling() {
    this.stopPolling();

    const matrixPollInterval = this.getMatrixPollInterval();
    const projectorPollInterval = this.getProjectorPollInterval();
    const tickInterval = Math.min(matrixPollInterval, projectorPollInterval);

    this.pollTimer = setInterval(() => {
      this.pollOnce().catch(() => undefined);
    }, tickInterval);

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
    const outputGroups = Array.from(this.trackedOutputGroups.values());
    const matrixPollInterval = this.getMatrixPollInterval();
    const projectorPollInterval = this.getProjectorPollInterval();
    const now = Date.now();
    const matrixActive = conPorts.length > 0 || outputGroups.length > 0;
    const projectorActive = this.projectorUsed;

    if (now - this.lastResourceRefreshAt >= 30000) {
      await this.refreshTaistoResources(true);
    }

    if (conPorts.length > 0 && !this.config.host) {
      this.updateStatus(InstanceStatus.BadConfig, "Host is required");
      return;
    }
    if (this.projectorUsed && !this.config.projectorHost) {
      this.updateStatus(InstanceStatus.BadConfig, "Projector host is required");
      return;
    }

    let hadError = false;
    let lastError = null;
    let projectorHadError = false;
    let lastProjectorError = null;

    const shouldPollMatrix =
      matrixActive && now - this.lastMatrixPollAt >= matrixPollInterval;
    const shouldPollProjector =
      projectorActive &&
      now - this.lastProjectorPollAt >= projectorPollInterval;

    if (shouldPollMatrix) {
      this.lastMatrixPollAt = now;
      for (const conPortId of conPorts) {
        try {
          const res = await this.taistoFetch(
            `/rest/con-ports/${encodeURIComponent(conPortId)}/video-connection`,
            { method: "GET" }
          );
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
      for (const trackedGroup of outputGroups) {
        try {
          const res = await this.taistoFetch(
            `/rest/con-groups/${encodeURIComponent(trackedGroup.conGroup)}/status?cpuPortId=${encodeURIComponent(trackedGroup.cpuPort)}`,
            { method: "GET" }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          this.outputGroupState.set(trackedGroup.key, data && data.active === true);
        } catch (err) {
          hadError = true;
          lastError = err;
          this.outputGroupState.set(trackedGroup.key, false);
          this.log(
            "warn",
            `Output group poll failed for ${trackedGroup.conGroup}: ${err?.message || err}`
          );
        }
      }
    } else if (!matrixActive) {
      this.consecutivePollErrors = 0;
    }

    if (hadError) {
      this.consecutivePollErrors += 1;
    } else {
      this.consecutivePollErrors = 0;
    }

    if (shouldPollProjector) {
      this.lastProjectorPollAt = now;
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
        this.projectorCurrentInput =
          data && data.current_input ? String(data.current_input) : null;
        this.projectorLabels = data && data.label ? data.label : null;
      } catch (err) {
        projectorHadError = true;
        lastProjectorError = err;
        this.log(
          "warn",
          `Projector poll failed: ${err?.message || err}`
        );
      }
    } else if (!projectorActive) {
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

    if (shouldPollMatrix) {
      this.checkFeedbacks("video_connection_active");
      this.checkFeedbacks("output_group_active");
    }
    if (shouldPollProjector) {
      this.checkFeedbacks("projector_power_on");
      this.checkFeedbacks("projector_input_active");
      this.checkFeedbacks("projector_current_input_label");
    }
  }
}

runEntrypoint(TaistoModule);
